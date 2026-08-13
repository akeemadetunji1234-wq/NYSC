import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
