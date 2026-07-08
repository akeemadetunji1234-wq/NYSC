import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password, role, phone, batch } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ message: "Email is already in use" }, { status: 409 });
    }

    // Double check OTP verification
    const verifiedOtp = await prisma.emailOtp.findUnique({
      where: { email }
    });

    if (!verifiedOtp || !verifiedOtp.verified) {
      return NextResponse.json({ message: "Email has not been verified" }, { status: 403 });
    }

    if (new Date() > verifiedOtp.expiresAt && !verifiedOtp.verified) { // although if verified it shouldn't matter, but let's be safe
      return NextResponse.json({ message: "Email verification expired" }, { status: 403 });
    }

    // TODO: periodic cleanup cron hook here: prisma.emailOtp.deleteMany({ where: { expiresAt: { lt: new Date() } } })

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // We assume role comes in as 'CORP' or 'AGENT'
    const userRole = role === "AGENT" ? "AGENT" : "CORP";

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
        agentVerified: false, // Always false initially for agents
        phone: phone || null,
        batch: batch || null
      }
    });

    return NextResponse.json({ message: "User registered successfully", user: { id: user.id, email: user.email, name: user.name, role: user.role } }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: "An error occurred during registration" }, { status: 500 });
  }
}
