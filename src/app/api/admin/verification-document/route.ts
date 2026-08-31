import { get } from "@vercel/blob";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { parseVerificationStorageKey, resolvePrivateUploadPath, VERIFICATION_MIME_TYPES } from "../../../../lib/safeFileStorage";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "../../../../lib/prisma";

function contentTypeFor(storageKey: string) {
  const extension = parseVerificationStorageKey(storageKey)?.extension || "";
  return VERIFICATION_MIME_TYPES[extension] || "application/octet-stream";
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN" || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = request.nextUrl.searchParams.get("userId")?.trim();
  if (!userId || userId.length > 100) {
    return NextResponse.json({ error: "Invalid user identifier" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { docUrl: true },
  });
  const storageKey = user?.docUrl;
  if (!storageKey) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const parsedStorageKey = parseVerificationStorageKey(storageKey);
    if (!parsedStorageKey) return new NextResponse("Not found", { status: 404 });

    if (parsedStorageKey.kind === "local") {
      const privatePath = resolvePrivateUploadPath(path.join(process.cwd(), ".private-uploads"), storageKey);
      if (!privatePath) return new NextResponse("Not found", { status: 404 });
      const file = await fs.readFile(privatePath);
      return new NextResponse(file, {
        headers: {
          "Content-Type": contentTypeFor(storageKey),
          "Content-Disposition": "inline",
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const result = await get(parsedStorageKey.pathname, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) {
      return new NextResponse("Not found", { status: 404 });
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType || contentTypeFor(storageKey),
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Verification document retrieval failed:", error);
    return new NextResponse("Not found", { status: 404 });
  }
}
