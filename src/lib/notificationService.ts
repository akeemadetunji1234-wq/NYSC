import { NotificationType } from "@prisma/client";
import { prisma } from "./prisma";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      link,
    },
  });
}
