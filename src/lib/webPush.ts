import webpush from "web-push";
import { prisma } from "./prisma";

function isConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function configure() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:hello@neat-affordable.ng", publicKey, privateKey);
  return true;
}

export function getWebPushPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
}

export async function sendPushToUser(userId: string, payload: { title: string; body: string; link?: string | null }) {
  if (!isConfigured() || !configure()) return { attempted: 0, sent: 0, removed: 0 };
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  let sent = 0;
  let removed = 0;
  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify(payload));
      await prisma.pushSubscription.update({ where: { id: subscription.id }, data: { failureCount: 0, lastSeenAt: new Date() } });
      sent += 1;
    } catch (error: any) {
      const statusCode = Number(error?.statusCode || 0);
      if (statusCode === 404 || statusCode === 410 || subscription.failureCount + 1 >= 3) {
        await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => undefined);
        removed += 1;
      } else {
        await prisma.pushSubscription.update({ where: { id: subscription.id }, data: { failureCount: { increment: 1 } } }).catch(() => undefined);
      }
      console.error("Web Push delivery failed", { subscriptionId: subscription.id, statusCode });
    }
  }
  return { attempted: subscriptions.length, sent, removed };
}
