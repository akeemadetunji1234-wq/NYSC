import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { getClientIp, rateLimit } from "../../../lib/rateLimit";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const preRegistrationEmailSchema = z.string().trim().toLowerCase().email().max(254);

function hasValidSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  return buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const formData = await request.formData();

    if (session?.user?.id) {
      const ip = getClientIp(request);
      const limit = await rateLimit(`upload:user:${session.user.id}:ip:${ip}`, 20, 15 * 60 * 1000);
      if (!limit.success) {
        return NextResponse.json(
          { error: "Too many uploads. Please try again later." },
          { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
        );
      }
    } else {
      const parsedEmail = preRegistrationEmailSchema.safeParse(formData.get("email"));
      if (!parsedEmail.success) {
        return NextResponse.json({ error: "Verified email is required before uploading." }, { status: 401 });
      }

      const verifiedOtp = await prisma.emailOtp.findUnique({ where: { email: parsedEmail.data } });
      if (!verifiedOtp || !verifiedOtp.verified || new Date() > verifiedOtp.expiresAt) {
        return NextResponse.json({ error: "Email verification is missing or expired." }, { status: 403 });
      }

      const ip = getClientIp(request);
      const limit = await rateLimit(`upload:prereg:${parsedEmail.data}:ip:${ip}`, 5, 15 * 60 * 1000);
      if (!limit.success) {
        return NextResponse.json(
          { error: "Too many uploads. Please try again later." },
          { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
        );
      }
    }
    const fileValue = formData.get("file");
    if (!(fileValue instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    const file = fileValue;

    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "File must be between 1 byte and 5MB" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, and WebP images are allowed" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasValidSignature(buffer, file.type)) {
      return NextResponse.json({ error: "The uploaded file is not a valid image" }, { status: 400 });
    }

    const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
    const filename = `${crypto.randomBytes(16).toString("hex")}.${extension}`;
    const hasBlobCredentials = Boolean(
      process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN),
    );

    if (process.env.VERCEL === "1") {
      if (!hasBlobCredentials) {
        return NextResponse.json(
          { error: "Uploads are temporarily unavailable. Configure Vercel Blob storage before accepting uploads." },
          { status: 503 },
        );
      }

      const pathname = `verification-documents/${filename}`;
      await put(pathname, buffer, {
        access: "private",
        addRandomSuffix: false,
        contentType: file.type,
        cacheControlMaxAge: 0,
      });
      return NextResponse.json({ storageKey: pathname });
    }

    const privateDir = path.join(process.cwd(), ".private-uploads");
    await fs.mkdir(privateDir, { recursive: true });
    await fs.writeFile(path.join(privateDir, filename), buffer, { flag: "wx" });
    return NextResponse.json({ storageKey: `local/${filename}` });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}
