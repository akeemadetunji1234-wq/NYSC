"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireRole } from "../../lib/authGuard";
import { rateLimit } from "../../lib/rateLimit";

const reportIdSchema = z.string().trim().min(1).max(100);
const reportStatusSchema = z.enum(["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"]);

const reportSchema = z.object({
  propertyId: z.string().trim().min(1).max(100),
  reason: z.enum(["MISLEADING", "UNSAFE", "DUPLICATE", "UNAVAILABLE", "OTHER"]),
  details: z.string().trim().min(10).max(2000),
});

export async function createListingReport(input: unknown) {
  const sessionUser = await requireRole("CORP");
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) throw new Error("Please provide a valid report.");

  const limit = rateLimit(`listing-report:${sessionUser.id}`, 5, 60 * 60 * 1000);
  if (!limit.success) throw new Error("You have submitted too many reports. Please try again later.");

  const property = await prisma.property.findUnique({
    where: { id: parsed.data.propertyId },
    select: { id: true, status: true },
  });
  if (!property || property.status !== "PUBLISHED") throw new Error("Listing is not available.");

  const existing = await prisma.listingReport.findFirst({
    where: {
      propertyId: property.id,
      reporterId: sessionUser.id,
      status: { in: ["OPEN", "REVIEWING"] },
    },
    select: { id: true },
  });
  if (existing) throw new Error("You already have an open report for this listing.");

  const report = await prisma.listingReport.create({
    data: {
      propertyId: property.id,
      reporterId: sessionUser.id,
      reason: parsed.data.reason,
      details: parsed.data.details,
    },
    select: {
      id: true,
      propertyId: true,
      reason: true,
      status: true,
      createdAt: true,
    },
  });

  revalidatePath(`/member/listing/${property.id}`);
  return { success: true, report };
}

export async function getAdminListingReports() {
  await requireRole("ADMIN");
  return prisma.listingReport.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      propertyId: true,
      reason: true,
      details: true,
      status: true,
      createdAt: true,
      property: { select: { title: true, agent: { select: { name: true, email: true } } } },
      reporter: { select: { name: true, email: true } },
    },
  });
}

export async function updateListingReportStatus(
  reportId: string,
  status: "OPEN" | "REVIEWING" | "RESOLVED" | "DISMISSED",
) {
  await requireRole("ADMIN");
  const safeReportId = reportIdSchema.parse(reportId);
  const safeStatus = reportStatusSchema.parse(status);
  const report = await prisma.listingReport.update({
    where: { id: safeReportId },
    data: { status: safeStatus },
    select: { id: true, status: true },
  });
  revalidatePath("/admin/reports");
  return report;
}

export async function getListingReportStatus(propertyId: string) {
  const sessionUser = await requireRole("CORP");
  const safePropertyId = reportIdSchema.parse(propertyId);
  return prisma.listingReport.findFirst({
    where: {
      propertyId: safePropertyId,
      reporterId: sessionUser.id,
      status: { in: ["OPEN", "REVIEWING"] },
    },
    select: { id: true, status: true },
  });
}

export const __reportSchema = reportSchema;
