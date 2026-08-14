import { get } from "@vercel/blob";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "../../../../lib/prisma";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function contentTypeFor(storageKey: string) {
  const extension = storageKey.split(".").pop()?.toLowerCase() || "";
  return MIME_TYPES[extension] || "application/octet-stream";
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
    if (storageKey.startsWith("local/")) {
      const filename = storageKey.slice("local/".length);
      if (!/^[a-f0-9]{32}\.(jpg|png|webp)$/i.test(filename)) {
        return new NextResponse("Not found", { status: 404 });
      }
      const file = await fs.readFile(path.join(process.cwd(), ".private-uploads", filename));
      return new NextResponse(file, {
        headers: {
          "Content-Type": contentTypeFor(storageKey),
          "Content-Disposition": "inline",
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const result = await get(storageKey, { access: "private", useCache: false });
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
