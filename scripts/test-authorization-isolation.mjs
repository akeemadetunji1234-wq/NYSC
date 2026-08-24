import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const baseUrl = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required; use an isolated test database.");
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(baseUrl)) {
  throw new Error(`Refusing to test against ${baseUrl}; use a local test server.`);
}

const prisma = new PrismaClient();
const password = process.env.TEST_AUTHZ_PASSWORD || "";
if (!password) throw new Error("TEST_AUTHZ_PASSWORD is required; keep it in the ignored test environment file.");
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const accountA = `nysc-authz-a-${suffix}@example.test`;
const accountB = `nysc-authz-b-${suffix}@example.test`;

function createCookieJar() {
  const cookies = new Map();
  return {
    record(response) {
      const values = typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : (response.headers.get("set-cookie") || "").split(/,(?=[^;]+=)/);
      for (const value of values) {
        const pair = value.split(";", 1)[0];
        const separator = pair.indexOf("=");
        if (separator > 0) cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
      }
    },
    header() {
      return [...cookies.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
    },
  };
}

async function json(response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

async function request(path, jar, init = {}) {
  const headers = new Headers(init.headers || {});
  const cookie = jar?.header();
  if (cookie) headers.set("cookie", cookie);
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers, redirect: "manual" });
  jar?.record(response);
  return response;
}

async function signIn(email, jar) {
  const csrfResponse = await request("/api/auth/csrf", jar);
  assert.equal(csrfResponse.status, 200, "CSRF endpoint must be reachable");
  const { csrfToken } = await json(csrfResponse);
  const body = new URLSearchParams({ csrfToken, email, password, redirect: "false", json: "true" });
  const response = await request("/api/auth/callback/credentials", jar, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", origin: baseUrl },
    body,
  });
  assert.ok([200, 302].includes(response.status), `credentials callback should authenticate (${response.status})`);
  const sessionResponse = await request("/api/auth/session", jar);
  assert.equal(sessionResponse.status, 200, "session endpoint must be reachable");
  const session = await json(sessionResponse);
  assert.equal(session.user?.email, email, "session must belong to the requested account");
}

async function expectStatus(label, response, statuses) {
  assert.ok(statuses.includes(response.status), `${label}: expected ${statuses.join(" or ")}, received ${response.status}`);
}

let userA;
let userB;
try {
  const passwordHash = await bcrypt.hash(password, 10);
  userA = await prisma.user.create({ data: { email: accountA, name: "NYSC Authz A", password: passwordHash, role: "CORP", operatingStates: [] } });
  userB = await prisma.user.create({ data: { email: accountB, name: "NYSC Authz B", password: passwordHash, role: "CORP", operatingStates: [] } });

  const unauthDocument = await request(`/api/admin/verification-document?userId=${encodeURIComponent(userB.id)}`);
  await expectStatus("unauthenticated private-document access", unauthDocument, [401, 403]);

  const unauthPusher = await request("/api/pusher/auth", undefined, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ socket_id: "123.456", channel_name: `private-user-${userB.id}` }),
  });
  await expectStatus("unauthenticated private-channel access", unauthPusher, [401, 403]);

  const jarA = createCookieJar();
  await signIn(accountA, jarA);

  const normalUserAdminPage = await request("/admin", jarA);
  await expectStatus("normal user direct admin-page access", normalUserAdminPage, [302, 307]);
  assert.match(normalUserAdminPage.headers.get("location") || "", /\/member/);

  const normalUserDocument = await request(`/api/admin/verification-document?userId=${encodeURIComponent(userB.id)}`, jarA);
  await expectStatus("normal user private-document access", normalUserDocument, [401, 403]);

  const crossAccountChannel = await request("/api/pusher/auth", jarA, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", origin: baseUrl },
    body: new URLSearchParams({ socket_id: "123.456", channel_name: `private-user-${userB.id}` }),
  });
  await expectStatus("account A subscribing to account B private channel", crossAccountChannel, [403]);

  console.log(JSON.stringify({
    ok: true,
    accounts: 2,
    checks: [
      "unauthenticated private document denied",
      "unauthenticated private channel denied",
      "normal user admin page denied",
      "normal user private document denied",
      "cross-account private channel denied",
    ],
  }, null, 2));
} finally {
  await prisma.user.deleteMany({ where: { id: { in: [userA?.id, userB?.id].filter(Boolean) } } });
  await prisma.$disconnect();
}
