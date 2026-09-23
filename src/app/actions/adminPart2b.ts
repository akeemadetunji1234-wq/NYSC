"use server";

import { randomUUID } from "node:crypto";
import { requireRole, requireAdminStepUp } from "../../lib/authGuard";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "../../lib/audit";
import { createNotification } from "../../lib/notificationService";

const userIdSchema = z.string().trim().min(1).max(100);

const artisanFieldsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  trade: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
  lga: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(1).max(40),
  rating: z.number().finite().min(0).max(5).optional(),
  verified: z.boolean().optional(),
}).strict();

export async function getArtisans() {
  await requireRole("ADMIN");
  return prisma.artisan.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createArtisan(data: {
  name: string;
  trade: string;
  state: string;
  lga: string;
  phone: string;
  rating?: number;
  verified?: boolean;
}) {
  await requireAdminStepUp();
  const parsed = artisanFieldsSchema.parse(data);
  const newArtisan = await prisma.artisan.create({
    data: {
      id: randomUUID(),
      name: parsed.name,
      trade: parsed.trade,
      state: parsed.state,
      lga: parsed.lga,
      phone: parsed.phone,
      rating: parsed.rating ?? 5.0,
      verified: parsed.verified ?? false,
    },
  });
  await writeAuditLog("ARTISAN_CREATED", newArtisan.id, `Artisan created: ${newArtisan.name}`);
  revalidatePath("/control-room-7f3k9d/artisans");
  revalidatePath("/member/artisans");
  return newArtisan;
}

export async function updateArtisan(
  id: string,
  data: {
    name?: string;
    trade?: string;
    state?: string;
    lga?: string;
    phone?: string;
    rating?: number;
    verified?: boolean;
  },
) {
  await requireAdminStepUp();
  const parsed = artisanFieldsSchema.partial().parse(data);
  const updated = await prisma.artisan.update({
    where: { id },
    data: {
      ...(parsed.name !== undefined ? { name: parsed.name } : {}),
      ...(parsed.trade !== undefined ? { trade: parsed.trade } : {}),
      ...(parsed.state !== undefined ? { state: parsed.state } : {}),
      ...(parsed.lga !== undefined ? { lga: parsed.lga } : {}),
      ...(parsed.phone !== undefined ? { phone: parsed.phone } : {}),
      ...(parsed.rating !== undefined ? { rating: parsed.rating } : {}),
      ...(parsed.verified !== undefined ? { verified: parsed.verified } : {}),
    },
  });
  await writeAuditLog("ARTISAN_UPDATED", id, "Artisan details updated");
  revalidatePath("/control-room-7f3k9d/artisans");
  revalidatePath("/member/artisans");
  return updated;
}

export async function deleteArtisan(id: string) {
  await requireAdminStepUp();
  await prisma.artisan.delete({ where: { id } });
  await writeAuditLog("ARTISAN_DELETED", id, "Artisan deleted");
  revalidatePath("/control-room-7f3k9d/artisans");
  revalidatePath("/member/artisans");
}

export async function verifyArtisan(id: string, verified: boolean) {
  await requireAdminStepUp();
  await prisma.artisan.update({ where: { id }, data: { verified } });
  await writeAuditLog(
    verified ? "ARTISAN_VERIFIED" : "ARTISAN_UNVERIFIED",
    id,
    `Artisan verification set to ${verified}`,
  );
  revalidatePath("/control-room-7f3k9d/artisans");
  revalidatePath("/member/artisans");
}

export async function getAgentFraudRiskReport() {
  await requireRole("ADMIN");
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    select: {
      id: true,
      name: true,
      email: true,
      properties: {
        select: {
          id: true,
          createdAt: true,
          status: true,
          viewings: { select: { status: true, createdAt: true, updatedAt: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return agents
    .map((agent) => {
      const recentListings = agent.properties.filter((property) => property.createdAt >= since).length;
      const viewings = agent.properties.flatMap((property) => property.viewings);
      const completedViewings = viewings.filter((viewing) => viewing.status === "COMPLETED").length;
      const respondedViewings = viewings.filter((viewing) => viewing.status !== "PENDING");
      const responseHours = respondedViewings.length
        ? respondedViewings.reduce(
            (sum, viewing) => sum + (viewing.updatedAt.getTime() - viewing.createdAt.getTime()) / 3_600_000,
            0,
          ) / respondedViewings.length
        : null;
      const responseRate = viewings.length
        ? Math.round((respondedViewings.length / viewings.length) * 100)
        : null;
      const flags: string[] = [];
      if (recentListings >= 10 && (responseRate === null || responseRate < 50))
        flags.push("listing spike with low response rate");
      if (recentListings >= 15 && completedViewings === 0)
        flags.push("high listing volume with no completed viewing");
      if (responseHours !== null && responseHours > 72) flags.push("slow viewing response");
      return {
        id: agent.id,
        name: agent.name || agent.email || "Unnamed agent",
        recentListings,
        completedViewings,
        responseRate,
        averageResponseHours: responseHours === null ? null : Math.round(responseHours * 10) / 10,
        flags,
        risk: flags.length >= 2 ? "HIGH" : flags.length === 1 ? "REVIEW" : "LOW",
      };
    })
    .sort((a, b) => b.flags.length - a.flags.length || b.recentListings - a.recentListings);
}

export async function getPendingProperties() {
  await requireRole("ADMIN");
  const properties = await prisma.property.findMany({
    where: { status: "PENDING" },
    include: { agent: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return properties.map((p) => ({
    id: p.id,
    title: p.title,
    hostName: p.agent?.name || p.agent?.email || "Unknown Agent",
    location: `${p.lga || ""} ${p.state || ""}`.trim() || p.location,
    pricePerNight: `₦${p.price.toLocaleString()}`,
    submittedAt: new Date(p.createdAt).toLocaleDateString(),
    bedrooms: p.bedrooms,
    images: p.images.filter(Boolean).slice(0, 5),
    status: p.status.toLowerCase(),
  }));
}

export async function updatePropertyStatus(id: string, status: "PUBLISHED" | "REJECTED", reason?: string) {
  await requireAdminStepUp();
  const safeId = userIdSchema.parse(id);
  const safeStatus = z.enum(["PUBLISHED", "REJECTED"]).parse(status);
  const safeReason = z.string().trim().max(2_000).optional().parse(reason);
  const pending = await prisma.property.findFirst({
    where: { id: safeId, status: "PENDING" },
    select: { id: true, title: true, agentId: true },
  });
  if (!pending) throw new Error("Pending listing not found");

  const result = await prisma.property.updateMany({
    where: { id: safeId, status: "PENDING" },
    data: {
      status: safeStatus,
      moderationReason:
        safeStatus === "REJECTED"
          ? safeReason || "Listing requires changes before it can be published."
          : null,
    },
  });
  if (result.count !== 1) throw new Error("Listing moderation state changed; refresh and try again");

  const auditReason =
    safeStatus === "REJECTED"
      ? `Listing rejected: ${safeReason || "Listing requires changes before it can be published."}`
      : "Listing approved and published";
  await writeAuditLog("PROPERTY_STATUS_CHANGED", safeId, auditReason);
  await createNotification(
    pending.agentId,
    "NEW_MESSAGE",
    safeStatus === "PUBLISHED" ? "Listing approved" : "Listing needs changes",
    safeStatus === "PUBLISHED"
      ? `${pending.title} is now published.`
      : `${pending.title} was not published. Reason: ${safeReason || "Listing requires changes before it can be published."}`,
    "/agent/properties",
  );
  revalidatePath("/control-room-7f3k9d/backlog");
  revalidatePath("/control-room-7f3k9d/properties");
  revalidatePath("/agent/properties");
  revalidatePath("/member");
}

export async function getPartners() {
  await requireRole("ADMIN");
  return prisma.partner.findMany({ orderBy: { joinedAt: "desc" } });
}
