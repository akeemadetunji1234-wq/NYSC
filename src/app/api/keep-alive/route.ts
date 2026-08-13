import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This route is called by a cron job every 4 minutes to keep the Neon DB awake.
export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return new NextResponse("Cron endpoint is not configured", { status: 503 });
    }
    if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Keep-alive ping failed:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
