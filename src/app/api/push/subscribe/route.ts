import { NextResponse } from "next/server";
import { requireUser } from "../../../../lib/authGuard";
import { prisma } from "../../../../lib/prisma";
import { z } from "zod";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({ p256dh: z.string().min(8).max(512), auth: z.string().min(8).max(512) }),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = subscriptionSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 });
    const { endpoint, keys } = parsed.data;
    const existing = await prisma.pushSubscription.findUnique({ where: { endpoint }, select: { userId: true } });
    if (existing && existing.userId !== user.id) return NextResponse.json({ error: "Push subscription belongs to another account" }, { status: 409 });
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      update: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth, lastSeenAt: new Date(), failureCount: 0 },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: subscription.id });
  } catch (error) {
    console.error("Push subscription registration failed", error);
    return NextResponse.json({ error: "Unable to register push subscription" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await requireUser();
    await prisma.pushSubscription.deleteMany({ where: { userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to remove push subscriptions" }, { status: 500 });
  }
}
