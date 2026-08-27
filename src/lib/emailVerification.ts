import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export const EMAIL_VERIFICATION_TOKEN_TTL_MS = 10 * 60 * 1000;
export const GOOGLE_ONBOARDING_STATE_TTL_MS = 10 * 60 * 1000;

export function createEmailVerificationToken(now = new Date()) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  return {
    rawToken,
    tokenHash: crypto.createHash("sha256").update(rawToken).digest("hex"),
    expiresAt: new Date(now.getTime() + EMAIL_VERIFICATION_TOKEN_TTL_MS),
  };
}

export function hashEmailVerificationToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function createGoogleOnboardingState(now = new Date()) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  return {
    rawToken,
    tokenHash: hashEmailVerificationToken(rawToken),
    expiresAt: new Date(now.getTime() + GOOGLE_ONBOARDING_STATE_TTL_MS),
  };
}

export async function resolveGoogleOnboardingState(rawToken: string, now = new Date()) {
  const record = await prisma.googleOnboardingState.findUnique({
    where: { tokenHash: hashEmailVerificationToken(rawToken) },
  });
  if (!record || record.consumedAt || record.expiresAt <= now) return null;
  return { email: record.email, name: record.name };
}

export async function consumeGoogleOnboardingState(
  tx: Prisma.TransactionClient,
  rawToken: string,
  now = new Date(),
) {
  const tokenHash = hashEmailVerificationToken(rawToken);
  const record = await tx.googleOnboardingState.findUnique({ where: { tokenHash } });
  if (!record || record.consumedAt || record.expiresAt <= now) return null;

  const result = await tx.googleOnboardingState.updateMany({
    where: { id: record.id, tokenHash, consumedAt: null, expiresAt: { gt: now } },
    data: { consumedAt: now },
  });
  return result.count === 1 ? { email: record.email, name: record.name } : null;
}

export async function consumeEmailVerificationToken(
  tx: Prisma.TransactionClient,
  rawToken: string,
  now = new Date(),
) {
  const tokenHash = hashEmailVerificationToken(rawToken);
  const record = await tx.emailOtp.findUnique({ where: { verificationTokenHash: tokenHash } });
  if (!record || record.verified || record.expiresAt <= now) return null;

  const result = await tx.emailOtp.updateMany({
    where: {
      id: record.id,
      verificationTokenHash: tokenHash,
      verified: false,
      expiresAt: { gt: now },
    },
    data: {
      verified: true,
      verificationTokenHash: null,
    },
  });
  return result.count === 1 ? { email: record.email } : null;
}
