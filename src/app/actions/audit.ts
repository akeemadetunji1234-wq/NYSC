"use server";

import { requireRole } from "../../lib/authGuard";
import { readAuditLogs, writeAuditLog } from "../../lib/audit";

export async function logAudit(action: string, target: string, details?: string) {
  return writeAuditLog(action, target, details);
}

export async function getAdminAuditLogs() {
  await requireRole("ADMIN");
  return readAuditLogs();
}
