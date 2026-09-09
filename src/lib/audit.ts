import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { prisma } from "./prisma";
import { authOptions } from "../app/api/auth/[...nextauth]/route";

/** Write an audit entry using the authenticated server session as actor. */
export async function writeAuditLog(action: string, target: string, details?: string) {
  const session = await getServerSession(authOptions);
  let ipAddress: string | null = null;
  try {
    const requestHeaders = await headers();
    ipAddress = (requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || "").slice(0, 100) || null;
  } catch {
    // Audit writes can also run in isolated jobs without a request context.
  }
  try {
    return await prisma.auditLog.create({
      data: {
        action,
        target,
        details,
        userId: session?.user?.id || null,
        ipAddress,
      },
    });
  } catch (error) {
    console.error("AUDIT_WRITE_FAILURE", { action, target, error });
    throw new Error("Security audit logging failed; the operation was not confirmed");
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
      ipAddress: true,
      createdAt: true,
    },
  });
}

/** System events intentionally have no user actor. */
export async function writeSystemAuditLog(action: string, target: string, details?: string) {
  try {
    return await prisma.auditLog.create({
      data: { action, target, details, userId: null },
    });
  } catch (error) {
    console.error("AUDIT_SYSTEM_WRITE_FAILURE", { action, target, error });
    throw new Error("System audit logging failed");
  }
}
