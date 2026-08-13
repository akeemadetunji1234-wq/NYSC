import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getClientIp, rateLimit } from "../../../../lib/rateLimit";

const registrationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128),
  role: z.enum(["CORP", "AGENT"]),
  phone: z.string().trim().max(40).nullable().optional(),
  batch: z.string().trim().max(40).nullable().optional(),
});

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const ipLimit = rateLimit(`register:ip:${ip}`, 5, 15 * 60 * 1000);
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
    const emailLimit = rateLimit(`register:email:${data.email}`, 3, 60 * 60 * 1000);
    if (!emailLimit.success) {
      return NextResponse.json(
        { message: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(emailLimit.retryAfterSeconds) } },
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return NextResponse.json({ message: "Email is already in use" }, { status: 409 });
    }

    const verifiedOtp = await prisma.emailOtp.findUnique({ where: { email: data.email } });
    if (!verifiedOtp || !verifiedOtp.verified || new Date() > verifiedOtp.expiresAt) {
      return NextResponse.json({ message: "Email verification is missing or expired" }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: data.role,
          agentVerified: false,
          phone: data.phone || null,
          batch: data.batch || null,
        },
      });
      await tx.emailOtp.delete({ where: { email: data.email } });
      return created;
    });

    return NextResponse.json(
      { message: "User registered successfully", user: { id: user.id, email: user.email, name: user.name, role: user.role } },
      { status: 201 },
    );
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ message: "Email is already in use" }, { status: 409 });
    }
    console.error("Registration error:", error);
    return NextResponse.json({ message: "An error occurred during registration" }, { status: 500 });
  }
}
