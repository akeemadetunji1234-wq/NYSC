"use server";

import { prisma } from "../../lib/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendPasswordResetEmail } from "../../lib/email";

const hashResetToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export async function requestPasswordReset(rawEmail: string) {
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const genericResponse: { success: boolean; error?: string } = { success: true };

  try {
    if (!email || email.length > 254) return genericResponse;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return genericResponse;

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.passwordResetToken.upsert({
      where: { email },
      update: { token: hashResetToken(token), expiresAt },
      create: { email, token: hashResetToken(token), expiresAt },
    });

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "");
    const resetLink = `${baseUrl}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetLink);

    return genericResponse;
  } catch (error) {
    console.error("Password reset request error:", error);
    return genericResponse;
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    if (!token || newPassword.length < 8 || newPassword.length > 128) {
      return { success: false, error: "Password must be between 8 and 128 characters." };
    }

    const resetRecord = await prisma.passwordResetToken.findUnique({ where: { token: hashResetToken(token) } });
    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      return { success: false, error: "Invalid or expired token." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.$transaction([
      prisma.user.update({
        where: { email: resetRecord.email },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.delete({ where: { id: resetRecord.id } }),
    ]);

    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return { success: false, error: "Failed to reset password." };
  }
}
