"use server";

import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { sendEmailOtp } from "../../lib/email";

export async function sendOtp(email: string) {
  try {
    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "An account with this email already exists." };
    }

    // 2. Check rate limit (1 send per 60 seconds)
    const existingOtp = await prisma.emailOtp.findUnique({
      where: { email },
    });

    if (existingOtp) {
      const now = new Date();
      const diffMs = now.getTime() - existingOtp.createdAt.getTime();
      if (diffMs < 60000) {
        return { success: false, error: "Please wait 60 seconds before requesting a new code." };
      }
    }

    // 3. Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 4. Upsert EmailOtp
    await prisma.emailOtp.upsert({
      where: { email },
      update: {
        codeHash,
        expiresAt,
        attempts: 0,
        verified: false,
        createdAt: new Date(),
      },
      create: {
        email,
        codeHash,
        expiresAt,
        attempts: 0,
        verified: false,
      },
    });

    // 5. Send Email via Resend
    await sendEmailOtp(email, code);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to send OTP. Please try again." };
  }
}

export async function verifyOtp(email: string, code: string) {
  try {
    const existingOtp = await prisma.emailOtp.findUnique({
      where: { email },
    });

    if (!existingOtp) {
      return { success: false, error: "No verification code found for this email." };
    }

    if (existingOtp.verified) {
      return { success: false, error: "Email is already verified." };
    }

    if (new Date() > existingOtp.expiresAt) {
      return { success: false, error: "Verification code has expired. Please request a new one." };
    }

    if (existingOtp.attempts >= 5) {
      return { success: false, error: "Too many failed attempts. Please request a new code." };
    }

    const isValid = await bcrypt.compare(code, existingOtp.codeHash);

    if (!isValid) {
      const newAttempts = existingOtp.attempts + 1;
      await prisma.emailOtp.update({
        where: { email },
        data: { attempts: newAttempts },
      });
      return { success: false, error: `Invalid code. ${5 - newAttempts} attempts remaining.` };
    }

    // Success
    await prisma.emailOtp.update({
      where: { email },
      data: { verified: true },
    });

    return { success: true };
  } catch (error: any) {
    console.error("verifyOtp error:", error);
    return { success: false, error: "Failed to verify OTP." };
  }
}
