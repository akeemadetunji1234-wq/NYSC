"use server";

import { prisma } from "../../lib/prisma";
import { requireUser } from "../../lib/authGuard";

export async function getNotifications(userId: string) {
  const sessionUser = await requireUser();
  if (sessionUser.id !== userId) {
    throw new Error("Forbidden");
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: sessionUser.id },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: notifications };
  } catch (error: any) {
    console.error("Failed to fetch notifications:", error);
    return { success: false, error: "Internal Server Error" };
  }
}

export async function markAsRead(notificationId: string) {
  const sessionUser = await requireUser();
  try {
    const result = await prisma.notification.updateMany({
      where: { id: notificationId, userId: sessionUser.id },
      data: { read: true },
    });
    if (result.count !== 1) throw new Error("Notification not found");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to mark notification as read:", error);
    return { success: false, error: "Internal Server Error" };
  }
}

export async function markAllAsRead(userId: string) {
  const sessionUser = await requireUser();
  if (sessionUser.id !== userId) {
    throw new Error("Forbidden");
  }

  try {
    await prisma.notification.updateMany({
      where: { userId: sessionUser.id, read: false },
      data: { read: true },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Failed to mark all notifications as read:", error);
    return { success: false, error: "Internal Server Error" };
  }
}
