import { NotificationDeliveryStatus, NotificationType } from "@prisma/client";
import { prisma } from "./prisma";
import { isPusherConfigured, pusherServer } from "./pusher";

const MAX_DELIVERY_ATTEMPTS = 5;
const CHANNEL_PREFIX = "private-user-";
const DEFAULT_EVENT = "notification:new";

type NotificationData = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: Date;
};

type CreateNotificationOptions = {
  eventName?: string;
  data?: Record<string, unknown>;
};

function toRealtimePayload(notification: NotificationData, data?: Record<string, unknown>) {
  return {
    notification: {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      link: notification.link,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
    },
    ...data,
  };
}

async function markDeliveryFailure(notificationId: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown realtime delivery error";
  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      deliveryStatus: NotificationDeliveryStatus.FAILED,
      lastDeliveryError: message.slice(0, 1000),
    },
  });
}

export async function publishNotification(
  notification: NotificationData,
  options: CreateNotificationOptions = {},
) {
  if (!isPusherConfigured || !pusherServer) return false;

  const eventName = options.eventName || DEFAULT_EVENT;
  const payload = toRealtimePayload(notification, options.data);
  const channel = `${CHANNEL_PREFIX}${notification.userId}`;

  try {
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        deliveryAttempts: { increment: 1 },
        lastDeliveryError: null,
      },
    });

    await pusherServer.trigger(channel, eventName, payload);

    if (eventName !== DEFAULT_EVENT) {
      await pusherServer.trigger(channel, DEFAULT_EVENT, payload);
    }

    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        deliveryStatus: NotificationDeliveryStatus.SENT,
        deliveredAt: new Date(),
        lastDeliveryError: null,
      },
    });
    return true;
  } catch (error) {
    console.error("Realtime notification delivery failed:", error);
    await markDeliveryFailure(notification.id, error);
    return false;
  }
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
  options: CreateNotificationOptions = {},
) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      link,
    },
  });

  await publishNotification(notification, options);
  return notification;
}

export async function deliverPendingNotifications(limit = 50) {
  if (!isPusherConfigured || !pusherServer) return { attempted: 0, delivered: 0 };

  const pending = await prisma.notification.findMany({
    where: {
      deliveryStatus: { in: [NotificationDeliveryStatus.PENDING, NotificationDeliveryStatus.FAILED] },
      deliveryAttempts: { lt: MAX_DELIVERY_ATTEMPTS },
    },
    orderBy: { createdAt: "asc" },
    take: Math.min(Math.max(limit, 1), 100),
  });

  let delivered = 0;
  for (const notification of pending) {
    const sent = await publishNotification(notification, {});
    if (sent) delivered += 1;
  }

  return { attempted: pending.length, delivered };
}
