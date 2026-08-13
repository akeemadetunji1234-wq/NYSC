"use server";

import { headers } from "next/headers";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { sendEmailOtp } from "../../lib/email";
import { rateLimit } from "../../lib/rateLimit";

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const otpSchema = z.string().regex(/^\d{6}$/);

async function getRequestIp() {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown"
  ).slice(0, 100);
}

export async function sendOtp(rawEmail: string) {
  const parsedEmail = emailSchema.safeParse(rawEmail);
  if (!parsedEmail.success) {
    return { success: false, error: "A valid email address is required." };
  }

  const email = parsedEmail.data;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: "An account with this email already exists." };
    }

    // Check for a valid, unverified OTP first. If one exists and was sent recently,
    // we allow the user to proceed to the verification screen without triggering a new rate-limit hit.
    const existingOtp = await prisma.emailOtp.findUnique({ where: { email } });
    if (existingOtp && !existingOtp.verified && existingOtp.expiresAt > new Date()) {
      // If the OTP was sent very recently (less than 60s), just return success to show the screen
      if (Date.now() - existingOtp.createdAt.getTime() < 60_000) {
        return { success: true };
      }
      
      // If the user is seeing "Too many requests" on the verify-google page, 
      // it's because the page re-renders or they refreshed. 
      // We check rate limits ONLY if we are about to send a NEW OTP.
    }

    const ip = await getRequestIp();
    const ipLimit = rateLimit(`otp:ip:${ip}`, 5, 15 * 60 * 1000);
    const emailLimit = rateLimit(`otp:email:${email}`, 3, 60 * 60 * 1000);
    
    if (!ipLimit.success || !emailLimit.success) {
      // If we have a valid unverified OTP, we can still return success to show the verification screen
      // even if the rate limit for SENDING is hit.
      if (existingOtp && !existingOtp.verified && existingOtp.expiresAt > new Date()) {
        return { success: true };
      }

      const retryAfterSeconds = Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds);
      return {
        success: false,
        error: `Too many requests. Please try again in ${retryAfterSeconds} seconds.`,
      };
    }

    if (existingOtp && Date.now() - existingOtp.createdAt.getTime() < 60_000) {
      return { success: false, error: "Please wait 60 seconds before requesting a new code." };
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.emailOtp.upsert({
      where: { email },
      update: { codeHash, expiresAt, attempts: 0, verified: false, createdAt: new Date() },
      create: { email, codeHash, expiresAt, attempts: 0, verified: false },
    });

    await sendEmailOtp(email, code);
    return { success: true };
  } catch (error) {
    console.error("sendOtp error:", error);
    return { success: false, error: "Failed to send OTP. Please try again." };
  }
}

export async function verifyOtp(rawEmail: string, rawCode: string) {
  const parsedEmail = emailSchema.safeParse(rawEmail);
  const parsedCode = otpSchema.safeParse(rawCode);
  if (!parsedEmail.success || !parsedCode.success) {
    return { success: false, error: "Invalid verification details." };
  }

  const email = parsedEmail.data;
  const ip = await getRequestIp();
  const ipLimit = rateLimit(`otp-verify:ip:${ip}`, 20, 15 * 60 * 1000);
  const emailLimit = rateLimit(`otp-verify:email:${email}`, 10, 15 * 60 * 1000);
  if (!ipLimit.success || !emailLimit.success) {
    return { success: false, error: "Too many verification attempts. Please try again later." };
  }

  try {
    const existingOtp = await prisma.emailOtp.findUnique({ where: { email } });
    if (!existingOtp) return { success: false, error: "No verification code found for this email." };
    if (existingOtp.verified) return { success: false, error: "Email is already verified." };
    if (new Date() > existingOtp.expiresAt) {
      return { success: false, error: "Verification code has expired. Please request a new one." };
    }
    if (existingOtp.attempts >= 5) {
      return { success: false, error: "Too many failed attempts. Please request a new code." };
    }

    const isValid = await bcrypt.compare(parsedCode.data, existingOtp.codeHash);
    if (!isValid) {
      const result = await prisma.emailOtp.updateMany({
        where: { email, verified: false, attempts: existingOtp.attempts },
        data: { attempts: { increment: 1 } },
      });
      if (result.count === 0) {
        return { success: false, error: "Too many failed attempts. Please request a new code." };
      }
      const remaining = Math.max(0, 5 - (existingOtp.attempts + 1));
      return { success: false, error: `Invalid code. ${remaining} attempts remaining.` };
    }

    const result = await prisma.emailOtp.updateMany({
      where: { email, verified: false, attempts: { lt: 5 } },
      data: { verified: true },
    });
    return result.count === 1
      ? { success: true }
      : { success: false, error: "Verification code is no longer valid." };
  } catch (error) {
    console.error("verifyOtp error:", error);
    return { success: false, error: "Failed to verify OTP." };
  }
}
