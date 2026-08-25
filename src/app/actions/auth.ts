"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { sendPasswordResetEmail } from "../../lib/email";
import { rateLimit } from "../../lib/rateLimit";
import { writeSecurityEvent } from "../../lib/securityEvents";

const hashResetToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");
const emailSchema = z.string().trim().toLowerCase().email().max(254);
const passwordSchema = z.string().min(8).max(128);
const resetTokenSchema = z.string().regex(/^[a-f0-9]{64}$/i);

async function getRequestIp() {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown"
  ).slice(0, 100);
}

export async function requestPasswordReset(rawEmail: string) {
  const genericResponse: { success: boolean; error?: string } = { success: true };
  const parsedEmail = emailSchema.safeParse(rawEmail);
  if (!parsedEmail.success) return genericResponse;

  const email = parsedEmail.data;
  const ip = await getRequestIp();
  const ipLimit = await rateLimit(`password-reset:ip:${ip}`, 5, 60 * 60 * 1000);
  const emailLimit = await rateLimit(`password-reset:email:${email}`, 3, 60 * 60 * 1000);
  if (!ipLimit.success || !emailLimit.success) return genericResponse;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return genericResponse;

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "");
    if (!baseUrl) {
      console.error("Password reset is not configured: NEXTAUTH_URL is missing");
      return genericResponse;
    }
    const resetBaseUrl = new URL(baseUrl);

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.upsert({
      where: { email },
      update: { token: hashResetToken(token), expiresAt },
      create: { email, token: hashResetToken(token), expiresAt },
    });

    const resetLink = new URL("/reset-password", resetBaseUrl);
    resetLink.searchParams.set("token", token);
    await sendPasswordResetEmail(email, resetLink.toString());
    return genericResponse;
  } catch (error) {
    console.error("Password reset request error:", error);
    return genericResponse;
  }
}

export async function resetPassword(rawToken: string, rawPassword: string) {
  const parsedToken = resetTokenSchema.safeParse(rawToken);
  const parsedPassword = passwordSchema.safeParse(rawPassword);
  if (!parsedToken.success || !parsedPassword.success) {
    return { success: false, error: "Password must be between 8 and 128 characters." };
  }

  const ip = await getRequestIp();
  const ipLimit = await rateLimit(`password-reset-confirm:ip:${ip}`, 10, 60 * 60 * 1000);
  const tokenLimit = await rateLimit(`password-reset-confirm:token:${parsedToken.data}`, 5, 60 * 60 * 1000);
  if (!ipLimit.success || !tokenLimit.success) {
    return { success: false, error: "Too many attempts. Please request a new reset link later." };
  }

  try {
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token: hashResetToken(parsedToken.data) },
    });
    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      return { success: false, error: "Invalid or expired token." };
    }

    const hashedPassword = await bcrypt.hash(parsedPassword.data, 12);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { email: resetRecord.email },
        data: { password: hashedPassword, sessionVersion: { increment: 1 }, failedLoginAttempts: 0, lockedUntil: null },
      });
      await tx.passwordResetToken.delete({ where: { id: resetRecord.id } });
    });

    await writeSecurityEvent("AUTH_PASSWORD_RESET", resetRecord.email, "Password reset completed and existing sessions invalidated");
    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return { success: false, error: "Failed to reset password." };
  }
}
