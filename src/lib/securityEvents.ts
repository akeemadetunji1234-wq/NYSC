import crypto from "node:crypto";
import { prisma } from "./prisma.ts";

function digest(value: string) {
  return crypto.createHash("sha256").update(`nysc-security:${value}`).digest("hex").slice(0, 16);
}

export function securityTarget(value: string) {
  return digest(value);
}

export async function writeSecurityEvent(action: string, target: string, details: string) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        target: securityTarget(target),
        details: details.slice(0, 500),
        userId: null,
      },
    });
  } catch (error) {
    // Security telemetry must never turn a safe denial into a 500 response.
    console.error("SECURITY_EVENT_WRITE_FAILURE", { action, error });
  }
}
