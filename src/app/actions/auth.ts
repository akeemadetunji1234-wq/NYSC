"use server";

import { prisma } from "../../lib/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendPasswordResetEmail } from "../../lib/email";

export async function requestPasswordReset(email: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { success: false, error: "If an account with that email exists, we sent a reset link." }; // Vague error for security
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.passwordResetToken.upsert({
      where: { email },
      update: { token, expiresAt },
      create: { email, token, expiresAt },
    });

    const resetLink = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/reset-password?token=${token}`;
    
    await sendPasswordResetEmail(email, resetLink);

    return { success: true };
  } catch (error) {
    console.error("Password reset request error:", error);
    return { success: false, error: error?.message || "Failed to process request." };
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    const resetRecord = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      return { success: false, error: "Invalid or expired token." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email: resetRecord.email },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } });

    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return { success: false, error: "Failed to reset password." };
  }
}

export async function getUserRoleByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true }
    });
    return user?.role || null;
  } catch (error) {
    console.error("Failed to fetch user role:", error);
    return null;
  }
}
