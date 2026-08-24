import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

function isVercelCron(request: Request) {
  return request.headers.get("user-agent")?.includes("vercel-cron/1.0") === true;
}

async function runCleanup(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret) return new NextResponse("Cron endpoint is not configured", { status: 503 });
  if (authHeader !== `Bearer ${cronSecret}`) return new NextResponse("Unauthorized", { status: 401 });
  if (request.method === "GET" && !isVercelCron(request)) {
    return new NextResponse("Use POST for manual cron execution", { status: 405, headers: { Allow: "POST" } });
  }

  try {
    const result = await prisma.emailOtp.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    return NextResponse.json({ message: "Cleaned up expired OTPs", count: result.count }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Cron cleanup error:", error);
    return NextResponse.json({ error: "Failed to cleanup OTPs" }, { status: 500 });
  }
}

export function GET(request: Request) {
  return runCleanup(request);
}

export function POST(request: Request) {
  return runCleanup(request);
}
