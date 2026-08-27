import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getClientIp } from "../../../../lib/rateLimit";
import { getAgentPostingError } from "../../../../lib/agentPosting";
import { checkCloudinaryUploadLimits, CLOUDINARY_BATCH_UPLOAD_LIMIT } from "../../../../lib/cloudinaryAbuse";
import { prisma } from "../../../../lib/prisma";
import { sameOriginAllowed, CLOUDINARY_UPLOAD_REQUEST_MAX_BYTES } from "../../../../lib/security";
import { safeOutboundFetch } from "../../../../lib/safeOutboundFetch";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BATCH_FILES = 5;

function hasValidSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
}

function limitedError(message: string, retryAfterSeconds: number) {
  return NextResponse.json(
    { error: message },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

export async function POST(request: Request) {
  if (!sameOriginAllowed(request)) return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > CLOUDINARY_UPLOAD_REQUEST_MAX_BYTES) return NextResponse.json({ error: "Request payload is too large" }, { status: 413 });

  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "AGENT") {
    return NextResponse.json({ error: "Only active agents can upload listing images." }, { status: 403 });
  }

  const agent = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, agentVerified: true, isBanned: true, verificationStatus: true },
  });
  if (!agent || agent.role !== "AGENT" || getAgentPostingError(agent)) {
    return NextResponse.json({ error: "Your agent account is not currently allowed to upload listing images." }, { status: 403 });
  }

  const ip = getClientIp(request);
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const fileValue = formData.get("file");
  if (!(fileValue instanceof File)) return NextResponse.json({ error: "No image file was supplied" }, { status: 400 });
  if (fileValue.size <= 0 || fileValue.size > MAX_UPLOAD_BYTES || !ALLOWED_TYPES.has(fileValue.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, and WebP images up to 10MB are allowed" }, { status: 400 });
  }

  const batchId = typeof formData.get("batchId") === "string" ? String(formData.get("batchId")).slice(0, 80) : "single";
  const batchCountRaw = Number(formData.get("batchCount") || 1);
  if (!Number.isInteger(batchCountRaw) || batchCountRaw < 1 || batchCountRaw > MAX_BATCH_FILES) {
    return NextResponse.json({ error: "An upload batch may contain between 1 and 5 images" }, { status: 400 });
  }
  if (batchCountRaw > CLOUDINARY_BATCH_UPLOAD_LIMIT) {
    return NextResponse.json({ error: "An upload batch may contain no more than 5 images" }, { status: 400 });
  }
  const limits = await checkCloudinaryUploadLimits(session.user.id, ip, batchId);
  if (!limits.success) return limitedError("Too many image uploads. Please try again later.", limits.retryAfterSeconds);

  const buffer = Buffer.from(await fileValue.arrayBuffer());
  if (!hasValidSignature(buffer, fileValue.type)) return NextResponse.json({ error: "The uploaded file is not a valid image" }, { status: 400 });

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();
  if (!cloudName || !uploadPreset || !/^[a-z0-9_-]{1,64}$/i.test(cloudName)) return NextResponse.json({ error: "Image upload is not configured" }, { status: 503 });

  const cloudinaryForm = new FormData();
  cloudinaryForm.append("file", fileValue, fileValue.name || "listing-image");
  cloudinaryForm.append("upload_preset", uploadPreset);
  try {
    const response = await safeOutboundFetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: cloudinaryForm }, {
      allowedHosts: ["api.cloudinary.com"],
      timeoutMs: 15_000,
      maxResponseBytes: 256_000,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || typeof data.secure_url !== "string") {
      console.error("Cloudinary upload rejected", { status: response.status, userId: session.user.id });
      return NextResponse.json({ error: "Image upload failed. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ secureUrl: data.secure_url });
  } catch (error) {
    console.error("Cloudinary upload request failed", { userId: session.user.id, error: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: "Image upload service is temporarily unavailable." }, { status: 503 });
  }
}
