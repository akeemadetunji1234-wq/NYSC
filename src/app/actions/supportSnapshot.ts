"use server";

import { z } from "zod";
import { requireAdminStepUp } from "../../lib/authGuard";
import { prisma } from "../../lib/prisma";
import { writeAuditLog } from "../../lib/audit";

const userIdSchema = z.string().trim().min(1).max(100);

export async function getAdminUserSupportSnapshot(
  userId: string,
  meta?: { reason?: string; ticketRef?: string },
) {
  const admin = await requireAdminStepUp();
  const safeId = userIdSchema.parse(userId);
  const reason = z.string().trim().min(8).max(300).parse(meta?.reason || "");
  const ticketRef = z.string().trim().max(80).optional().parse(meta?.ticketRef || undefined);
  const user = await prisma.user.findUnique({
    where: { id: safeId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      state: true,
      createdAt: true,
      isPremium: true,
      agentVerified: true,
      properties: {
        select: { id: true, title: true, status: true, createdAt: true },
        take: 20,
        orderBy: { createdAt: "desc" },
      },
      bookings: {
        select: { id: true, status: true, date: true, property: { select: { title: true } } },
        take: 20,
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { sentMessages: true, receivedMessages: true, notifications: true } },
    },
  });
  if (!user) throw new Error("User not found");
  await writeAuditLog(
    "ADMIN_SUPPORT_SNAPSHOT_VIEWED",
    safeId,
    `Read-only support snapshot by admin ${admin.id}; reason=${reason.slice(0, 200)}; ticket=${ticketRef || "none"}`,
  );
  return user;
}
