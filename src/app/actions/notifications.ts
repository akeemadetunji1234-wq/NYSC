"use server";

import { prisma } from "../../lib/prisma";
import { NotificationType } from "@prisma/client";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        link,
      },
    });
    return { success: true, data: notification };
  } catch (error: any) {
    console.error("Failed to create notification:", error);
    return { success: false, error: "Internal Server Error" };
  }
}

export async function getNotifications(userId: string) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: notifications };
  } catch (error: any) {
    console.error("Failed to fetch notifications:", error);
    return { success: false, error: "Internal Server Error" };
  }
}

export async function markAsRead(notificationId: string) {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Failed to mark notification as read:", error);
    return { success: false, error: "Internal Server Error" };
  }
}

export async function markAllAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Failed to mark all notifications as read:", error);
    return { success: false, error: "Internal Server Error" };
  }
}
