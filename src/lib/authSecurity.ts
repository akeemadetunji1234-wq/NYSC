import crypto from "node:crypto";

export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
export const LOGIN_DELAY_MAX_MS = 800;

/** Bounded friction for repeated failures without attacker-triggerable permanent lockout. */
export function loginFailureDelayMs(failedAttempts: number) {
  const normalizedAttempts = Number.isFinite(failedAttempts) ? Math.max(0, Math.floor(failedAttempts)) : 0;
  return Math.min(LOGIN_DELAY_MAX_MS, normalizedAttempts * 200);
}

export function loginDeviceSignal(ip: string, userAgent: string | null | undefined) {
  return crypto.createHash("sha256").update(`nysc-login-device:${ip}:${(userAgent || "unknown").slice(0, 300)}`).digest("hex").slice(0, 32);
}

export function internalDelay(ms: number) {
  if (ms <= 0) return Promise.resolve();
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
export function shouldRejectSessionToken(token: { invalidated?: boolean; isBanned?: boolean; sub?: string; role?: string }) {
  return Boolean(token.invalidated || token.isBanned || !token.sub || !token.role);
}

export { resolveSafeCallbackUrl } from "./safeRedirect";
