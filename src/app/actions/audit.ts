"use server";

import { prisma } from "../../lib/prisma";
import { requireRole } from "../../lib/authGuard";

export async function logAudit(action: string, target: string, details?: string, userId?: string) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        target,
        details,
        userId,
      }
    });
  } catch (err) {
    console.error("Failed to log audit:", err);
  }
}

export async function getAdminAuditLogs() {
  await requireRole("ADMIN");
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
