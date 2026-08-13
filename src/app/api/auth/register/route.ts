import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawEmail = typeof body.email === "string" ? body.email : "";
    const email = rawEmail.trim().toLowerCase();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = body.role;
    const phone = typeof body.phone === "string" ? body.phone.trim() : null;
    const batch = typeof body.batch === "string" ? body.batch.trim() : null;

    if (!email || !password || !name) {
      return NextResponse.json({ message: "Name, email, and password are required" }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
      return NextResponse.json({ message: "A valid email is required" }, { status: 400 });
    }
    if (password.length < 8 || password.length > 128) {
      return NextResponse.json({ message: "Password must be between 8 and 128 characters" }, { status: 400 });
    }
    if (name.length > 120 || (phone && phone.length > 40) || (batch && batch.length > 40)) {
      return NextResponse.json({ message: "One or more fields are too long" }, { status: 400 });
    }
    if (role !== "CORP" && role !== "AGENT") {
      return NextResponse.json({ message: "Invalid account role" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "Email is already in use" }, { status: 409 });
    }

    const verifiedOtp = await prisma.emailOtp.findUnique({ where: { email } });
    if (!verifiedOtp || !verifiedOtp.verified || new Date() > verifiedOtp.expiresAt) {
      return NextResponse.json({ message: "Email verification is missing or expired" }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          agentVerified: false,
          phone,
          batch,
        },
      });
      await tx.emailOtp.delete({ where: { email } });
      return created;
    });

    return NextResponse.json(
      { message: "User registered successfully", user: { id: user.id, email: user.email, name: user.name, role: user.role } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: "An error occurred during registration" }, { status: 500 });
  }
}
