"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requirePremium } from "../../lib/entitlements";
import { rateLimit } from "../../lib/rateLimit";

const coordinate = z.coerce.number().finite().min(-180).max(180);
const labelSchema = z.string().trim().max(160).optional();

export async function startCheckIn(lat: unknown, lng: unknown, expiresInHours: unknown, propertyId?: unknown, label?: unknown) {
  const user = await requirePremium("CORP_PREMIUM");
  const limit = await rateLimit(`safety-checkin:${user.id}`, 10, 24 * 60 * 60 * 1000);
  if (!limit.success) throw new Error("Daily safety check-in limit reached. Try again tomorrow.");
  const latitude = z.coerce.number().finite().min(-90).max(90).parse(lat);
  const longitude = coordinate.parse(lng);
  const hours = z.coerce.number().int().refine((value) => [2, 4, 6].includes(value), "Duration must be 2, 4, or 6 hours.").parse(expiresInHours);
  const safePropertyId = propertyId ? z.string().cuid().parse(propertyId) : undefined;
  if (safePropertyId) {
    const property = await prisma.property.findUnique({ where: { id: safePropertyId }, select: { id: true } });
    if (!property) throw new Error("Property not found.");
  }
  const token = randomBytes(24).toString("base64url");
  const checkIn = await prisma.safetyCheckIn.create({ data: { userId: user.id, token, propertyId: safePropertyId, latitude, longitude, label: labelSchema.parse(label) || null, expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000) }, select: { id: true, token: true, expiresAt: true } });
  return { ...checkIn, shareUrl: `/safety-checkin/${checkIn.token}` };
}

export async function markSafe(checkInId: unknown) {
  const user = await requirePremium("CORP_PREMIUM");
  const id = z.string().cuid().parse(checkInId);
  const result = await prisma.safetyCheckIn.updateMany({ where: { id, userId: user.id, expiresAt: { gt: new Date() } }, data: { checkedInAt: new Date() } });
  if (result.count !== 1) throw new Error("Check-in not found or expired.");
  return { success: true };
}

export async function getMySafetyCheckIns() {
  const user = await requirePremium("CORP_PREMIUM");
  return prisma.safetyCheckIn.findMany({ where: { userId: user.id, expiresAt: { gt: new Date() } }, select: { id: true, token: true, label: true, expiresAt: true, checkedInAt: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 20 });
}
