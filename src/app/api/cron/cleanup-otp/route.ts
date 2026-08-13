import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    if (!cronSecret) {
      return new NextResponse('Cron endpoint is not configured', { status: 503 });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const result = await prisma.emailOtp.deleteMany({
      where: { expiresAt: { lt: new Date() } }
    });

    return NextResponse.json({ message: "Cleaned up expired OTPs", count: result.count });
  } catch (error) {
    console.error("Cron cleanup error:", error);
    return NextResponse.json({ error: "Failed to cleanup OTPs" }, { status: 500 });
  }
}
