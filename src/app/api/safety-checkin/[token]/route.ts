import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{32,}$/.test(token)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const checkIn = await prisma.safetyCheckIn.findUnique({ where: { token }, select: { latitude: true, longitude: true, label: true, expiresAt: true, checkedInAt: true, user: { select: { name: true } } } });
  if (!checkIn || checkIn.expiresAt <= new Date()) return NextResponse.json({ error: "This safety check-in has expired or does not exist." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ firstName: checkIn.user.name?.trim().split(/\s+/)[0] || "A user", latitude: checkIn.latitude, longitude: checkIn.longitude, label: checkIn.label, expiresAt: checkIn.expiresAt, checkedInAt: checkIn.checkedInAt, status: checkIn.checkedInAt ? "SAFE" : "ACTIVE" }, { headers: { "Cache-Control": "no-store" } });
}
