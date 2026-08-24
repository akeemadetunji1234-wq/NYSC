#!/usr/bin/env node

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const baseUrl = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const email = (process.env.TEST_EMAIL || `nysc-e2e-${Date.now()}@example.test`).trim().toLowerCase();
const password = process.env.TEST_PASSWORD || "";
const otpCode = process.env.TEST_OTP_CODE || "000000";
const name = process.env.TEST_NAME || "NYSC E2E Test User";
const role = process.env.TEST_ROLE || "CORP";
const allowProduction = process.env.ALLOW_PRODUCTION_TEST === "true";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required; run this test only against an isolated staging/test database.");
}
if (!password) throw new Error("TEST_PASSWORD is required; keep it in the ignored test environment file.");
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(baseUrl) && !allowProduction) {
  throw new Error(`Refusing to write through ${baseUrl}. Set ALLOW_PRODUCTION_TEST=true only after explicit approval.`);
}
if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("TEST_EMAIL must be a valid email address.");
if (password.length < 8) throw new Error("TEST_PASSWORD must be at least 8 characters.");
if (!/^\d{6}$/.test(otpCode)) throw new Error("TEST_OTP_CODE must be exactly six digits.");
if (!['CORP', 'AGENT'].includes(role)) throw new Error("TEST_ROLE must be CORP or AGENT.");

const prisma = new PrismaClient();
const cookies = new Map();

function recordCookies(response) {
  const values = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : (response.headers.get("set-cookie") || "").split(/,(?=[^;]+=)/);
  for (const value of values) {
    const pair = value.split(";", 1)[0];
    const separator = pair.indexOf("=");
    if (separator > 0) cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
}

function cookieHeader() {
  return [...cookies.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
}

async function request(path, init = {}) {
  const headers = new Headers(init.headers || {});
  const cookie = cookieHeader();
  if (cookie) headers.set("cookie", cookie);
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers, redirect: "manual" });
  recordCookies(response);
  return response;
}

async function json(response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

const checks = [];
function check(name, condition, detail = "") {
  checks.push({ name, passed: Boolean(condition), detail });
  if (!condition) throw new Error(`${name}${detail ? `: ${detail}` : ""}`);
}

let userId;
try {
  await prisma.emailOtp.deleteMany({ where: { email } });
  await prisma.user.deleteMany({ where: { email } });

  const codeHash = await bcrypt.hash(otpCode, 10);
  await prisma.emailOtp.create({
    data: {
      email,
      codeHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
      verified: false,
    },
  });

  const blocked = await request("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, email, password, role, phone: "+2348000000000", batch: "E2E" }),
  });
  const blockedBody = await json(blocked);
  check("registration rejects an unverified OTP", blocked.status === 403, `received ${blocked.status} ${JSON.stringify(blockedBody)}`);

  await prisma.emailOtp.update({ where: { email }, data: { verified: true } });

  const registered = await request("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, email, password, role, phone: "+2348000000000", batch: "E2E" }),
  });
  const registeredBody = await json(registered);
  check("registration creates the user", registered.status === 201, `received ${registered.status} ${JSON.stringify(registeredBody)}`);
  check("registration response is minimized", !JSON.stringify(registeredBody).includes(password), "password appeared in response");
  check("registration response contains no password hash", !JSON.stringify(registeredBody).includes("$2b$"), "bcrypt hash appeared in response");
  userId = registeredBody?.user?.id;
  check("registration returns a user id", typeof userId === "string" && userId.length > 0);

  const csrfResponse = await request("/api/auth/csrf");
  const csrfBody = await json(csrfResponse);
  check("NextAuth issues a CSRF token", csrfResponse.status === 200 && typeof csrfBody.csrfToken === "string");

  const failedLogin = await request("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken: csrfBody.csrfToken, email, password: `${password}-wrong`, json: "true", redirect: "false", callbackUrl: "/member" }),
  });
  check("invalid credentials are rejected", failedLogin.status !== 302 && failedLogin.status !== 303 || !cookieHeader().includes("next-auth.session-token"), `received ${failedLogin.status}`);

  const login = await request("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken: csrfBody.csrfToken, email, password, json: "true", redirect: "false", callbackUrl: "/member" }),
  });
  const loginBody = await json(login);
  check("valid credentials login succeeds", login.status === 200 || login.status === 302 || login.status === 303, `received ${login.status} ${JSON.stringify(loginBody)}`);
  check("login establishes a session cookie", [...cookies.keys()].some((key) => key.includes("session-token")), "no NextAuth session cookie found");

  const sessionResponse = await request("/api/auth/session");
  const sessionBody = await json(sessionResponse);
  check("authenticated session is readable", sessionResponse.status === 200 && sessionBody?.user?.email === email, `received ${sessionResponse.status} ${JSON.stringify(sessionBody)}`);
  check("session exposes the expected role", sessionBody?.user?.role === role, `received ${JSON.stringify(sessionBody)}`);
  check("session does not expose the password", !JSON.stringify(sessionBody).includes(password) && !JSON.stringify(sessionBody).includes("$2b$"));

  const protectedPage = await request(role === "AGENT" ? "/agent" : "/member");
  check("authenticated role page is reachable", protectedPage.status >= 200 && protectedPage.status < 400, `received ${protectedPage.status}`);

  console.log(JSON.stringify({ ok: true, baseUrl, email, role, checks }, null, 2));
} finally {
  if (userId) await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
  await prisma.emailOtp.deleteMany({ where: { email } }).catch(() => undefined);
  await prisma.$disconnect();
}
