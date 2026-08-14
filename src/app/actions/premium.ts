"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requirePremium } from "../../lib/entitlements";
import { requireRole, requireUser } from "../../lib/authGuard";
import { pusherServer } from "../../lib/pusher";
import { writeAuditLog } from "../../lib/audit";

const savedSearchSchema = z.object({
  name: z.string().trim().min(1).max(80),
  state: z.string().trim().max(120).optional().nullable(),
  lga: z.string().trim().max(120).optional().nullable(),
  minPrice: z.number().finite().min(0).max(100_000_000).optional().nullable(),
  maxPrice: z.number().finite().min(0).max(100_000_000).optional().nullable(),
  bedrooms: z.number().int().min(1).max(100).optional().nullable(),
}).refine((value) => value.minPrice == null || value.maxPrice == null || value.minPrice <= value.maxPrice, {
  message: "Minimum price cannot exceed maximum price",
});

function idSchema(value: unknown) {
  return z.string().trim().min(1).max(100).parse(value);
}

export async function getSavedSearches() {
  const user = await requirePremium("CORP_PREMIUM");
  return prisma.savedSearch.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
}

export async function createSavedSearch(input: unknown) {
  const user = await requirePremium("CORP_PREMIUM");
  const parsed = savedSearchSchema.parse(input);
  const search = await prisma.savedSearch.create({ data: { ...parsed, userId: user.id } });
  revalidatePath("/member/notifications");
  return search;
}

export async function updateSavedSearch(id: string, input: unknown) {
  const user = await requirePremium("CORP_PREMIUM");
  const parsed = savedSearchSchema.partial().parse(input);
  const safeId = idSchema(id);
  const existing = await prisma.savedSearch.findFirst({ where: { id: safeId, userId: user.id } });
  if (!existing) throw new Error("Saved search not found");
  return prisma.savedSearch.update({ where: { id: safeId }, data: parsed });
}

export async function deleteSavedSearch(id: string) {
  const user = await requirePremium("CORP_PREMIUM");
  const safeId = idSchema(id);
  const existing = await prisma.savedSearch.findFirst({ where: { id: safeId, userId: user.id }, select: { id: true } });
  if (!existing) throw new Error("Saved search not found");
  await prisma.savedSearch.delete({ where: { id: safeId } });
  revalidatePath("/member/notifications");
}

export async function getPremiumArtisans() {
  await requirePremium("CORP_PREMIUM");
  const artisans = await prisma.artisan.findMany({
    where: { verified: true },
    include: {
      reviews: {
        where: { status: "PUBLISHED" },
        select: { id: true, rating: true, comment: true, createdAt: true, corpMember: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
    orderBy: [{ verifiedAt: "desc" }, { rating: "desc" }, { createdAt: "desc" }],
  });
  return artisans.map((artisan) => {
    const ratings = artisan.reviews.map((review) => review.rating);
    const reviewRating = ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : artisan.rating;
    return { ...artisan, rating: Number(reviewRating.toFixed(1)), reviewCount: ratings.length };
  });
}

export async function submitArtisanReview(input: unknown) {
  const user = await requirePremium("CORP_PREMIUM");
  const parsed = z.object({ artisanId: z.string().trim().min(1).max(100), rating: z.number().int().min(1).max(5), comment: z.string().trim().min(10).max(2000) }).parse(input);
  const artisan = await prisma.artisan.findUnique({ where: { id: parsed.artisanId }, select: { id: true, verified: true } });
  if (!artisan?.verified) throw new Error("Reviews can only be submitted for verified artisans");
  const review = await prisma.artisanReview.upsert({
    where: { artisanId_corpMemberId: { artisanId: parsed.artisanId, corpMemberId: user.id } },
      update: { rating: parsed.rating, comment: parsed.comment, status: "PENDING" },
      create: { artisanId: parsed.artisanId, corpMemberId: user.id, rating: parsed.rating, comment: parsed.comment, status: "PENDING" },
  });
  const aggregate = await prisma.artisanReview.aggregate({ where: { artisanId: parsed.artisanId, status: "PUBLISHED" }, _avg: { rating: true } });
  await prisma.artisan.update({ where: { id: parsed.artisanId }, data: { rating: aggregate._avg.rating ?? 0 } });
  await writeAuditLog("ARTISAN_REVIEW_SUBMITTED", review.id, "Premium corp member reviewed an artisan");
  revalidatePath("/member/artisans");
  return review;
}

export async function moderateArtisanReview(id: string, status: "PUBLISHED" | "HIDDEN") {
  await requireRole("ADMIN");
  const review = await prisma.artisanReview.update({ where: { id: idSchema(id) }, data: { status } });
  await writeAuditLog("ARTISAN_REVIEW_MODERATED", review.id, `Artisan review status changed to ${status}`);
  revalidatePath("/member/artisans");
  return review;
}

export async function getTransportGuides() {
  await requirePremium("CORP_PREMIUM");
  const items = await prisma.contentItem.findMany({
    where: { category: "TRANSPORT", published: true },
    select: { id: true, slug: true, title: true, content: true, updatedAt: true },
    orderBy: { title: "asc" },
  });
  return items.map((item) => {
    try {
      const parsed = JSON.parse(item.content);
      return { ...parsed, id: item.id, slug: item.slug, title: item.title, updatedAt: item.updatedAt };
    } catch {
      return { id: item.id, slug: item.slug, title: item.title, description: item.content, routes: [], updatedAt: item.updatedAt };
    }
  });
}

export async function notifySavedSearchMatches(property: { id: string; title: string; state: string; lga?: string | null; price: number; bedrooms: number }) {
  const searches = await prisma.savedSearch.findMany({ where: { active: true }, select: { id: true, userId: true, name: true, state: true, lga: true, minPrice: true, maxPrice: true, bedrooms: true } });
  const matches = searches.filter((search) => (!search.state || search.state.toLowerCase() === property.state.toLowerCase()) && (!search.lga || search.lga.toLowerCase() === (property.lga || "").toLowerCase()) && (search.minPrice == null || property.price >= search.minPrice) && (search.maxPrice == null || property.price <= search.maxPrice) && (search.bedrooms == null || property.bedrooms >= search.bedrooms));
  await Promise.all(matches.map(async (search) => {
    const notification = await prisma.notification.create({ data: { userId: search.userId, type: "NEW_MESSAGE", title: `New listing matches ${search.name}`, body: `${property.title} in ${property.state} matches one of your saved searches.`, link: `/member/listing/${property.id}` } });
    if (process.env.PUSHER_APP_ID && process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.PUSHER_SECRET && process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
      await pusherServer.trigger(`private-user-${search.userId}`, "saved-search:match", { notificationId: notification.id, searchId: search.id, propertyId: property.id, title: property.title });
    }
  }));
  return matches.length;
}

export async function createAgentLead(propertyId: string, message?: string) {
  const user = await requireUser();
  if (user.role !== "CORP") throw new Error("Only corp members can create leads");
  const safePropertyId = idSchema(propertyId);
  const property = await prisma.property.findFirst({ where: { id: safePropertyId, status: "PUBLISHED" }, select: { id: true, agentId: true, title: true } });
  if (!property) throw new Error("Property not found");
  const existing = await prisma.agentLead.findFirst({ where: { propertyId: property.id, corpMemberId: user.id, status: { not: "CLOSED" } }, select: { id: true } });
  const lead = existing
    ? await prisma.agentLead.update({ where: { id: existing.id }, data: { message: message?.trim().slice(0, 2000) || undefined, status: "NEW" } })
    : await prisma.agentLead.create({ data: { propertyId: property.id, agentId: property.agentId, corpMemberId: user.id, message: message?.trim().slice(0, 2000) || null } });
  await prisma.property.update({ where: { id: property.id }, data: { inquiries: { increment: existing ? 0 : 1 } } });
  await prisma.propertyEvent.create({ data: { propertyId: property.id, viewerId: user.id, type: "INQUIRY", metadata: { leadId: lead.id } } });
  await prisma.notification.create({ data: { userId: property.agentId, type: "NEW_MESSAGE", title: "New property enquiry", body: `${user.name || "A corp member"} is interested in ${property.title}.`, link: "/agent/leads" } });
  if (process.env.PUSHER_APP_ID && process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.PUSHER_SECRET && process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
    await pusherServer.trigger(`private-user-${property.agentId}`, "lead:new", { leadId: lead.id, propertyId: property.id, title: property.title });
  }
  revalidatePath("/agent/leads");
  return lead;
}

export async function getAgentLeads(status?: string) {
  const user = await requirePremium("AGENT_PREMIUM");
  return prisma.agentLead.findMany({
    where: { agentId: user.id, ...(status ? { status } : {}) },
    include: { property: { select: { id: true, title: true, location: true } }, corpMember: { select: { id: true, name: true, email: true, phone: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function updateAgentLead(id: string, status: "NEW" | "CONTACTED" | "QUALIFIED" | "VIEWING" | "WON" | "LOST" | "CLOSED") {
  const user = await requirePremium("AGENT_PREMIUM");
  const lead = await prisma.agentLead.update({ where: { id: idSchema(id), agentId: user.id }, data: { status, lastContactedAt: status === "CONTACTED" ? new Date() : undefined } });
  await writeAuditLog("AGENT_LEAD_UPDATED", lead.id, `Lead status changed to ${status}`);
  revalidatePath("/agent/leads");
  return lead;
}

export async function getAgentAnalytics(input?: { from?: string; to?: string }) {
  const user = await requirePremium("AGENT_PREMIUM");
  const from = input?.from ? new Date(input.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = input?.to ? new Date(input.to) : new Date();
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) throw new Error("Invalid date range");
  const events = await prisma.propertyEvent.findMany({ where: { property: { agentId: user.id }, createdAt: { gte: from, lte: to } }, select: { propertyId: true, type: true, createdAt: true, property: { select: { title: true } } }, orderBy: { createdAt: "asc" } });
  const leads = await prisma.agentLead.count({ where: { agentId: user.id, createdAt: { gte: from, lte: to } } });
  const rows = new Map<string, { id: string; title: string; views: number; saves: number; inquiries: number; bookings: number; boosts: number }>();
  for (const event of events) {
    const row = rows.get(event.propertyId) ?? { id: event.propertyId, title: event.property.title, views: 0, saves: 0, inquiries: 0, bookings: 0, boosts: 0 };
    if (event.type === "VIEW") row.views += 1;
    if (event.type === "SAVE") row.saves += 1;
    if (event.type === "INQUIRY") row.inquiries += 1;
    if (event.type === "BOOKING") row.bookings += 1;
    if (event.type === "BOOST") row.boosts += 1;
    rows.set(event.propertyId, row);
  }
  const data = [...rows.values()].map((row) => ({ ...row, conversionRate: row.views ? Number(((row.inquiries / row.views) * 100).toFixed(2)) : 0 }));
  return { from, to, leads, totals: data.reduce((sum, row) => ({ views: sum.views + row.views, saves: sum.saves + row.saves, inquiries: sum.inquiries + row.inquiries, bookings: sum.bookings + row.bookings, boosts: sum.boosts + row.boosts }), { views: 0, saves: 0, inquiries: 0, bookings: 0, boosts: 0 }), data };
}

export async function exportAgentAnalytics(input?: { from?: string; to?: string }) {
  const report = await getAgentAnalytics(input);
  const header = "Property,Views,Saves,Inquiries,Bookings,Boosts,Conversion Rate";
  const lines = report.data.map((row) => [row.title, row.views, row.saves, row.inquiries, row.bookings, row.boosts, `${row.conversionRate}%`].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","));
  return [header, ...lines].join("\n");
}
