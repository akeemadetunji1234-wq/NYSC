import { createHmac, randomBytes, timingSafeEqual, createCipheriv, createDecipheriv, scryptSync } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const STEP_UP_COOKIE = "nysc_admin_mfa_stepup";
const STEP_UP_MAX_AGE_MS = 15 * 60 * 1000;
const TOTP_WINDOW = 1;

function getSecretKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET || "";
  if (secret.length < 16) throw new Error("NEXTAUTH_SECRET required for MFA crypto");
  return scryptSync(secret, "nysc-admin-mfa-v1", 32);
}

export function generateTotpSecret(): string {
  const buf = randomBytes(20);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(input: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = input.replace(/=+$/, "").toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of cleaned) {
    const idx = alphabet.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, "0");
}

export function verifyTotpCode(secretBase32: string, code: string, now = Date.now()): boolean {
  const cleaned = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  const secret = base32Decode(secretBase32);
  const step = Math.floor(now / 1000 / 30);
  const expected = Buffer.from(cleaned);
  for (let w = -TOTP_WINDOW; w <= TOTP_WINDOW; w++) {
    const candidate = Buffer.from(hotp(secret, step + w));
    if (candidate.length === expected.length && timingSafeEqual(candidate, expected)) return true;
  }
  return false;
}

export function encryptTotpSecret(plain: string): string {
  const key = getSecretKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function decryptTotpSecret(payload: string): string {
  const key = getSecretKey();
  const raw = Buffer.from(payload, "base64url");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function totpOtpAuthUrl(email: string, secret: string): string {
  const label = encodeURIComponent(`Neat & Affordable:${email}`);
  const issuer = encodeURIComponent("Neat & Affordable");
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

function signStepUp(userId: string, ts: number): string {
  const key = getSecretKey();
  const payload = `${userId}.${ts}`;
  const sig = createHmac("sha256", key).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyStepUpToken(token: string, userId: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [uid, tsStr, sig] = parts;
  if (uid !== userId) return false;
  const ts = Number(tsStr);
  if (!Number.isFinite(ts) || Date.now() - ts > STEP_UP_MAX_AGE_MS || Date.now() < ts - 60_000) return false;
  const key = getSecretKey();
  const expected = createHmac("sha256", key).update(`${uid}.${tsStr}`).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function setAdminStepUpCookie(userId: string) {
  const token = signStepUp(userId, Date.now());
  const jar = await cookies();
  jar.set(STEP_UP_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || process.env.VERCEL === "1",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(STEP_UP_MAX_AGE_MS / 1000),
  });
}

export async function clearAdminStepUpCookie() {
  const jar = await cookies();
  jar.delete(STEP_UP_COOKIE);
}

export async function hasRecentAdminStepUp(userId: string): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(STEP_UP_COOKIE)?.value;
  if (!token) return false;
  return verifyStepUpToken(token, userId);
}

export async function getAdminMfaStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpEnabled: true, totpEnabledAt: true, role: true },
  });
  if (!user || user.role !== "ADMIN") return { enabled: false, enabledAt: null as Date | null };
  return { enabled: user.totpEnabled, enabledAt: user.totpEnabledAt };
}

export const ADMIN_MFA_STEP_UP_MS = STEP_UP_MAX_AGE_MS;
