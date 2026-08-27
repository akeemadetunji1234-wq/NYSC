import assert from "node:assert/strict";
import { decode, encode } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";
import { resolveSafeCallbackUrl, SESSION_MAX_AGE_SECONDS, shouldRejectSessionToken } from "../src/lib/authSecurity";
import { checkCloudinaryUploadLimits } from "../src/lib/cloudinaryAbuse";
import { resetRateLimitForTests } from "../src/lib/rateLimit";
import { getBookingDayRange, lockBookingSlot } from "../src/lib/bookingConcurrency";
import { requestSizeLimit, UPLOAD_REQUEST_MAX_BYTES, CLOUDINARY_UPLOAD_REQUEST_MAX_BYTES } from "../src/lib/security";

const prisma = new PrismaClient();
const secret = process.env.NEXTAUTH_SECRET;
if (!secret || secret.length < 32) throw new Error("NEXTAUTH_SECRET must be a 32+ character isolated test value");

async function rejectsDecode(token: string) {
  try {
    await decode({ token, secret });
    return false;
  } catch {
    return true;
  }
}

let propertyId: string | undefined;
let corpAId: string | undefined;
let corpBId: string | undefined;
try {
  assert.equal(SESSION_MAX_AGE_SECONDS, 7 * 24 * 60 * 60);
  const token = await encode({ secret, maxAge: 60 * 60, token: { sub: "synthetic-user", role: "CORP" } });
  const decoded = await decode({ token, secret });
  assert.equal(decoded?.sub, "synthetic-user");
  assert.equal(decoded?.role, "CORP");
  const tokenParts = token.split(".");
  tokenParts[4] = `${tokenParts[4].startsWith("a") ? "b" : "a"}${tokenParts[4].slice(1)}`;
  assert.equal(await rejectsDecode(tokenParts.join(".")), true, "tampered JWT must be rejected");
  const expired = await encode({ secret, maxAge: -60, token: { sub: "synthetic-user", role: "CORP" } });
  assert.equal(await rejectsDecode(expired), true, "expired JWT must be rejected");

  assert.equal(resolveSafeCallbackUrl("https://evil.example/phish", "https://nysc-mu.vercel.app"), "https://nysc-mu.vercel.app");
  assert.equal(resolveSafeCallbackUrl("https://nysc-mu.vercel.app/member/history", "https://nysc-mu.vercel.app"), "https://nysc-mu.vercel.app/member/history");
  assert.equal(resolveSafeCallbackUrl("//evil.example/phish", "https://nysc-mu.vercel.app"), "https://nysc-mu.vercel.app");
  assert.equal(resolveSafeCallbackUrl("/member/history", "https://nysc-mu.vercel.app"), "https://nysc-mu.vercel.app/member/history");
  assert.equal(shouldRejectSessionToken({ sub: "synthetic-user", role: "CORP", invalidated: true }), true);
  assert.equal(shouldRejectSessionToken({ sub: "synthetic-user", role: "CORP", isBanned: true }), true);
  assert.equal(shouldRejectSessionToken({ sub: "synthetic-user" }), true);
  assert.equal(shouldRejectSessionToken({ role: "CORP" }), true);

  assert.equal(requestSizeLimit("/api/upload"), UPLOAD_REQUEST_MAX_BYTES);
  assert.equal(requestSizeLimit("/api/upload/cloudinary"), CLOUDINARY_UPLOAD_REQUEST_MAX_BYTES);
  resetRateLimitForTests();
  for (let i = 0; i < 5; i += 1) {
    assert.equal((await checkCloudinaryUploadLimits("agent-a", "198.51.100.20", "batch-a")).success, true);
  }
  assert.equal((await checkCloudinaryUploadLimits("agent-a", "198.51.100.20", "batch-a")).success, false, "a six-file batch must be blocked");
  resetRateLimitForTests();
  for (let i = 0; i < 20; i += 1) {
    assert.equal((await checkCloudinaryUploadLimits("agent-a", "198.51.100.20", `batch-${i}`)).success, true);
  }
  assert.equal((await checkCloudinaryUploadLimits("agent-a", "198.51.100.20", "batch-21")).success, false, "the per-agent upload ceiling must be enforced");
  resetRateLimitForTests();
  for (let i = 0; i < 40; i += 1) {
    assert.equal((await checkCloudinaryUploadLimits(`agent-${i}`, "198.51.100.21", `batch-${i}`)).success, true);
  }
  assert.equal((await checkCloudinaryUploadLimits("agent-41", "198.51.100.21", "batch-41")).success, false, "the shared-IP upload ceiling must be enforced");

  const [agent, corpA, corpB] = await Promise.all([
    prisma.user.create({ data: { email: `security-agent-${Date.now()}@example.test`, name: "Synthetic Agent", role: "AGENT", agentVerified: true, verificationStatus: "VERIFIED", operatingStates: ["Oyo"] } }),
    prisma.user.create({ data: { email: `security-corp-a-${Date.now()}@example.test`, name: "Synthetic Corp A", role: "CORP", operatingStates: [] } }),
    prisma.user.create({ data: { email: `security-corp-b-${Date.now()}@example.test`, name: "Synthetic Corp B", role: "CORP", operatingStates: [] } }),
  ]);
  corpAId = corpA.id;
  corpBId = corpB.id;
  const property = await prisma.property.create({
    data: { title: "Concurrency Test Lodge", description: "Synthetic fixture", location: "Ibadan", state: "Oyo", lga: "Ibadan North", price: 250000, bedrooms: 1, bathrooms: 1, amenities: [], images: [], status: "PUBLISHED", agentId: agent.id },
  });
  propertyId = property.id;
  const slotDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const reserve = async (corpMemberId: string) => prisma.$transaction(async (tx) => {
    await lockBookingSlot(tx, property.id, slotDate, "10:00");
    const { start, end } = getBookingDayRange(slotDate);
    const existing = await tx.booking.findFirst({ where: { propertyId: property.id, date: { gte: start, lt: end }, time: "10:00", status: { in: ["PENDING", "ACCEPTED"] } }, select: { id: true } });
    if (existing) throw new Error("slot-conflict");
    return tx.booking.create({ data: { propertyId: property.id, corpMemberId, date: slotDate, time: "10:00", amount: property.price, status: "PENDING", feeStatus: "UNPAID" } });
  });
  const reservations = await Promise.allSettled([reserve(corpA.id), reserve(corpB.id)]);
  assert.equal(reservations.filter((result) => result.status === "fulfilled").length, 1, "only one concurrent reservation may claim a slot");
  assert.equal(await prisma.booking.count({ where: { propertyId: property.id, status: "PENDING" } }), 1);
  console.log(JSON.stringify({ ok: true, checks: ["jwt-tamper", "jwt-expiry", "redirect-allowlist", "session-revocation", "cloudinary-batch-limit", "cloudinary-agent-limit", "cloudinary-ip-limit", "cloudinary-request-size", "booking-slot-concurrency"] }, null, 2));
} finally {
  if (propertyId) await prisma.booking.deleteMany({ where: { propertyId } }).catch(() => undefined);
  if (propertyId) await prisma.property.delete({ where: { id: propertyId } }).catch(() => undefined);
  if (corpAId || corpBId) await prisma.user.deleteMany({ where: { id: { in: [corpAId, corpBId].filter((id): id is string => Boolean(id)) } } }).catch(() => undefined);
  await prisma.user.deleteMany({ where: { email: { startsWith: "security-agent-" } } }).catch(() => undefined);
  await prisma.$disconnect();
}
