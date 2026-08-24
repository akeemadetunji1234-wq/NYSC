import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const baseUrl = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const password = process.env.TEST_BUSINESS_PASSWORD || "";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required; use an isolated test database.");
if (!password) throw new Error("TEST_BUSINESS_PASSWORD is required; keep it in the ignored test environment file.");
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(baseUrl)) throw new Error("Business-flow tests are local-only.");

const prisma = new PrismaClient();
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const accounts = {
  corp: `business-corp-${suffix}@example.test`,
  agent: `business-agent-${suffix}@example.test`,
  admin: `business-admin-${suffix}@example.test`,
};
const jars = new Map();

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
    header() { return [...cookies.entries()].map(([key, value]) => `${key}=${value}`).join("; "); },
  };
}

async function request(path, jar) {
  const headers = new Headers();
  const cookie = jar?.header();
  if (cookie) headers.set("cookie", cookie);
  const response = await fetch(`${baseUrl}${path}`, { headers, redirect: "manual" });
  jar?.record(response);
  return response;
}

async function signIn(email) {
  const jar = createCookieJar();
  const csrfResponse = await request("/api/auth/csrf", jar);
  assert.equal(csrfResponse.status, 200);
  const { csrfToken } = await csrfResponse.json();
  const response = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded", origin: baseUrl, cookie: jar.header() },
    body: new URLSearchParams({ csrfToken, email, password, redirect: "false", json: "true" }),
  });
  jar.record(response);
  assert.ok([200, 302].includes(response.status), `login failed for ${email}: ${response.status}`);
  const session = await request("/api/auth/session", jar);
  assert.equal(session.status, 200);
  const body = await session.json();
  assert.equal(body.user?.email, email);
  return jar;
}

async function expectStatus(label, path, jar, allowed) {
  const response = await request(path, jar);
  assert.ok(allowed.includes(response.status), `${label}: expected ${allowed.join(" or ")}, got ${response.status}`);
  return response;
}

let corp;
let agent;
let admin;
let property;
let booking;
try {
  const passwordHash = await bcrypt.hash(password, 10);
  [corp, agent, admin] = await Promise.all([
    prisma.user.create({ data: { email: accounts.corp, name: "Business Corp", password: passwordHash, role: "CORP", operatingStates: [] } }),
    prisma.user.create({ data: { email: accounts.agent, name: "Business Agent", password: passwordHash, role: "AGENT", agentVerified: true, verificationStatus: "VERIFIED", operatingStates: ["Oyo"] } }),
    prisma.user.create({ data: { email: accounts.admin, name: "Business Admin", password: passwordHash, role: "ADMIN", operatingStates: [] } }),
  ]);
  property = await prisma.property.create({
    data: {
      title: "Authorization Test Lodge",
      description: "Disposable business-flow fixture",
      location: "Ibadan",
      state: "Oyo",
      lga: "Ibadan North",
      price: 250000,
      bedrooms: 2,
      bathrooms: 1,
      amenities: ["Water"],
      images: [],
      status: "PUBLISHED",
      agentId: agent.id,
    },
  });
  booking = await prisma.booking.create({
    data: {
      propertyId: property.id,
      corpMemberId: corp.id,
      date: new Date(Date.now() + 86400000),
      time: "10:00",
      amount: property.price,
      status: "ACCEPTED",
      feeStatus: "PAID",
    },
  });

  jars.set("corp", await signIn(accounts.corp));
  jars.set("agent", await signIn(accounts.agent));
  jars.set("admin", await signIn(accounts.admin));

  await expectStatus("Corp marketplace", "/member/marketplace", jars.get("corp"), [200]);
  await expectStatus("Corp booking history", "/member/history", jars.get("corp"), [200]);
  await expectStatus("Corp own booking detail", `/member/booking/${booking.id}`, jars.get("corp"), [200]);
  await expectStatus("Corp denied Agent Viewings", "/agent/viewings", jars.get("corp"), [307]);
  await expectStatus("Corp denied Admin Payouts", "/admin/payouts", jars.get("corp"), [307]);

  await expectStatus("Agent Viewings", "/agent/viewings", jars.get("agent"), [200]);
  await expectStatus("Agent Bookings", "/agent/bookings", jars.get("agent"), [200]);
  await expectStatus("Agent denied Admin Payouts", "/admin/payouts", jars.get("agent"), [307]);
  await expectStatus("Agent denied Corp booking detail", `/member/booking/${booking.id}`, jars.get("agent"), [307]);

  await expectStatus("Admin Payouts", "/admin/payouts", jars.get("admin"), [200]);
  await expectStatus("Admin Reports", "/admin/reports", jars.get("admin"), [200]);
  await expectStatus("Admin denied Corp booking detail", `/member/booking/${booking.id}`, jars.get("admin"), [307]);

  console.log(JSON.stringify({
    ok: true,
    fixture: { accounts: 3, property: true, paidBookingReference: true },
    checks: [
      "Corp can view marketplace, history, and own booking",
      "Corp cannot view Agent or Admin routes",
      "Agent can view Viewings and Bookings",
      "Agent cannot view Admin Payouts or Corp booking detail",
      "Admin can view Payouts and Reports",
      "Admin cannot use Corp booking detail workflow",
    ],
  }, null, 2));
} finally {
  if (property?.id) await prisma.property.deleteMany({ where: { id: property.id } });
  await prisma.user.deleteMany({ where: { id: { in: [corp?.id, agent?.id, admin?.id].filter(Boolean) } } });
  await prisma.$disconnect();
}
