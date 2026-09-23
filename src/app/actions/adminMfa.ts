"use server";

import { z } from "zod";
import { requireRole } from "../../lib/authGuard";
import { prisma } from "../../lib/prisma";
import { writeAuditLog } from "../../lib/audit";
import { rateLimit } from "../../lib/rateLimit";
import {
  clearAdminStepUpCookie,
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  setAdminStepUpCookie,
  totpOtpAuthUrl,
  verifyTotpCode,
} from "../../lib/adminMfa";

const codeSchema = z.string().trim().regex(/^\d{6}$/);

export async function beginAdminMfaEnrollment() {
  const admin = await requireRole("ADMIN");
  const existing = await prisma.user.findUnique({
    where: { id: admin.id },
    select: { totpEnabled: true },
  });
  if (existing?.totpEnabled) {
    throw new Error("MFA is already enabled. Disable it before re-enrolling.");
  }

  const secret = generateTotpSecret();
  const encrypted = encryptTotpSecret(secret);
  await prisma.user.update({
    where: { id: admin.id },
    data: { totpSecret: encrypted, totpEnabled: false, totpEnabledAt: null },
  });
  await writeAuditLog("ADMIN_MFA_ENROLL_STARTED", admin.id, "Administrator started TOTP enrollment");

  return {
    secret,
    otpauthUrl: totpOtpAuthUrl(admin.email || admin.id, secret),
  };
}

export async function confirmAdminMfaEnrollment(code: string) {
  const admin = await requireRole("ADMIN");
  const limit = await rateLimit(`admin-mfa-enroll:${admin.id}`, 10, 15 * 60 * 1000);
  if (!limit.success) throw new Error("Too many attempts. Try again later.");

  const parsed = codeSchema.parse(code);
  const user = await prisma.user.findUnique({
    where: { id: admin.id },
    select: { totpSecret: true, totpEnabled: true },
  });
  if (!user?.totpSecret) throw new Error("Start enrollment first.");
  if (user.totpEnabled) throw new Error("MFA is already enabled.");

  const plain = decryptTotpSecret(user.totpSecret);
  if (!verifyTotpCode(plain, parsed)) {
    await writeAuditLog("ADMIN_MFA_ENROLL_FAILED", admin.id, "Invalid TOTP during enrollment");
    throw new Error("Invalid authenticator code.");
  }

  await prisma.user.update({
    where: { id: admin.id },
    data: { totpEnabled: true, totpEnabledAt: new Date() },
  });
  await setAdminStepUpCookie(admin.id);
  await writeAuditLog("ADMIN_MFA_ENABLED", admin.id, "Administrator enabled TOTP MFA");
  return { ok: true as const };
}

export async function verifyAdminMfaStepUp(code: string) {
  const admin = await requireRole("ADMIN");
  const limit = await rateLimit(`admin-mfa-stepup:${admin.id}`, 15, 15 * 60 * 1000);
  if (!limit.success) throw new Error("Too many attempts. Try again later.");

  const parsed = codeSchema.parse(code);
  const user = await prisma.user.findUnique({
    where: { id: admin.id },
    select: { totpSecret: true, totpEnabled: true },
  });
  if (!user?.totpEnabled || !user.totpSecret) {
    throw new Error("MFA is not enabled for this administrator.");
  }

  const plain = decryptTotpSecret(user.totpSecret);
  if (!verifyTotpCode(plain, parsed)) {
    await writeAuditLog("ADMIN_MFA_STEPUP_FAILED", admin.id, "Invalid TOTP during step-up");
    throw new Error("Invalid authenticator code.");
  }

  await setAdminStepUpCookie(admin.id);
  await writeAuditLog("ADMIN_MFA_STEPUP_OK", admin.id, "Administrator completed MFA step-up");
  return { ok: true as const, validForMinutes: 15 };
}

export async function disableAdminMfa(code: string) {
  const admin = await requireRole("ADMIN");
  const parsed = codeSchema.parse(code);
  const user = await prisma.user.findUnique({
    where: { id: admin.id },
    select: { totpSecret: true, totpEnabled: true },
  });
  if (!user?.totpEnabled || !user.totpSecret) throw new Error("MFA is not enabled.");

  const plain = decryptTotpSecret(user.totpSecret);
  if (!verifyTotpCode(plain, parsed)) {
    await writeAuditLog("ADMIN_MFA_DISABLE_FAILED", admin.id, "Invalid TOTP while disabling MFA");
    throw new Error("Invalid authenticator code.");
  }

  await prisma.user.update({
    where: { id: admin.id },
    data: { totpSecret: null, totpEnabled: false, totpEnabledAt: null },
  });
  await clearAdminStepUpCookie();
  await writeAuditLog("ADMIN_MFA_DISABLED", admin.id, "Administrator disabled TOTP MFA");
  return { ok: true as const };
}
