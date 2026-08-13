import { getServerSession } from "next-auth";
import { prisma } from "./prisma";
import { authOptions } from "../app/api/auth/[...nextauth]/route";

/** Write an audit entry using the authenticated server session as actor. */
export async function writeAuditLog(action: string, target: string, details?: string) {
  try {
    const session = await getServerSession(authOptions);
    await prisma.auditLog.create({
      data: {
        action,
        target,
        details,
        userId: session?.user?.id || null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

/** Read a bounded audit feed. The caller must enforce admin access. */
export async function readAuditLogs() {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      action: true,
      target: true,
      details: true,
      userId: true,
      createdAt: true,
    },
  });
}

/** System events intentionally have no user actor. */
export async function writeSystemAuditLog(action: string, target: string, details?: string) {
  try {
    await prisma.auditLog.create({
      data: { action, target, details, userId: null },
    });
  } catch (error) {
    console.error("Failed to write system audit log:", error);
  }
}
