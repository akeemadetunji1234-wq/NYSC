import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getClientIp, rateLimit } from "../../../../lib/rateLimit";
import { sameOriginAllowed, sanitizeText } from "../../../../lib/security";
import { consumeGoogleOnboardingState, hashEmailVerificationToken } from "../../../../lib/emailVerification";

const registrationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128),
  role: z.enum(["CORP", "AGENT"]),
  phone: z.string().trim().max(40).nullable().optional(),
  batch: z.string().trim().max(40).nullable().optional(),
  // Agent fields
  agency: z.string().trim().max(120).nullable().optional(),
  experience: z.string().trim().max(40).nullable().optional(),
  operatingStates: z.array(z.string()).optional(),
  bio: z.string().trim().max(1000).nullable().optional(),
  docType: z.string().trim().max(40).nullable().optional(),
  docNumber: z.string().trim().max(40).nullable().optional(),
  docUrl: z.string().trim().max(240).nullable().optional(),
  googleOnboardingState: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
});

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function POST(req: Request) {
  if (!sameOriginAllowed(req)) {
    return NextResponse.json({ message: "Cross-origin request rejected" }, { status: 403 });
  }
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > 64 * 1024) {
    return NextResponse.json({ message: "Request payload is too large" }, { status: 413 });
  }
  const ip = getClientIp(req);
  const ipLimit = await rateLimit(`register:ip:${ip}`, 5, 15 * 60 * 1000);
  if (!ipLimit.success) {
    return NextResponse.json(
      { message: "Too many registration attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } },
    );
  }

  try {
    const body: unknown = await req.json();
    const parsed = registrationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid registration details" }, { status: 400 });
    }

    const data = parsed.data;
    const onboardingState = data.googleOnboardingState
      ? await prisma.googleOnboardingState.findUnique({ where: { tokenHash: hashEmailVerificationToken(data.googleOnboardingState) } })
      : null;
    if (data.googleOnboardingState && (!onboardingState || onboardingState.consumedAt || onboardingState.expiresAt <= new Date())) {
      return NextResponse.json({ message: "Google sign-in verification is missing or expired" }, { status: 403 });
    }
    if (onboardingState && onboardingState.email !== data.email) {
      return NextResponse.json({ message: "Unable to complete registration with these details" }, { status: 400 });
    }
    const registrationEmail = onboardingState?.email || data.email;
    const registrationName = onboardingState?.name || data.name;
    if (data.role === "AGENT" && data.docUrl && !/^(verification-documents|local)\/[a-f0-9]{32}\.(jpg|png|webp)$/i.test(data.docUrl)) {
      return NextResponse.json({ message: "Invalid verification document reference" }, { status: 400 });
    }
    const emailLimit = await rateLimit(`register:email:${registrationEmail}`, 3, 60 * 60 * 1000);
    if (!emailLimit.success) {
      return NextResponse.json(
        { message: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(emailLimit.retryAfterSeconds) } },
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email: registrationEmail } });
    if (existingUser) {
      return NextResponse.json({ message: "Unable to complete registration with these details" }, { status: 400 });
    }

    const verifiedOtp = await prisma.emailOtp.findUnique({ where: { email: registrationEmail } });
    if (!verifiedOtp || !verifiedOtp.verified || new Date() > verifiedOtp.expiresAt) {
      return NextResponse.json({ message: "Email verification is missing or expired" }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: sanitizeText(registrationName, 120),
          email: registrationEmail,
          password: hashedPassword,
          role: data.role,
          emailVerified: new Date(),
          agentVerified: false,
          phone: data.phone ? sanitizeText(data.phone, 40) : null,
          batch: data.batch ? sanitizeText(data.batch, 40) : null,
          agency: data.agency ? sanitizeText(data.agency, 120) : null,
          experience: data.experience ? sanitizeText(data.experience, 40) : null,
          operatingStates: (data.operatingStates || []).map((state) => sanitizeText(state, 80)).filter(Boolean).slice(0, 20),
          bio: data.bio ? sanitizeText(data.bio, 1000) : null,
          docType: data.docType ? sanitizeText(data.docType, 40) : null,
          docNumber: data.docNumber ? sanitizeText(data.docNumber, 40) : null,
          docUrl: data.docUrl || null,
          verificationStatus: data.role === "AGENT" ? "PENDING" : "UNVERIFIED",
        },
      });
      await tx.emailOtp.delete({ where: { email: registrationEmail } });
      if (data.googleOnboardingState) {
        const consumed = await consumeGoogleOnboardingState(tx, data.googleOnboardingState);
        if (!consumed || consumed.email !== registrationEmail) {
          throw new Error("Google onboarding state was already consumed or mismatched");
        }
      }
      return created;
    });

    return NextResponse.json(
      { message: "User registered successfully", user: { id: user.id, email: user.email, name: user.name, role: user.role } },
      { status: 201 },
    );
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ message: "Unable to complete registration with these details" }, { status: 400 });
    }
    console.error("Registration error:", error);
    return NextResponse.json({ message: "An error occurred during registration" }, { status: 500 });
  }
}
