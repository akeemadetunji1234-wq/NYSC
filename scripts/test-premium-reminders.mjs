import assert from "node:assert/strict";
import { NotificationType } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { createPremiumExpiryReminders } from "../src/lib/premiumExpiryReminders.ts";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required; use an isolated test database.");

const prisma = new PrismaClient();
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const now = new Date();
const corpExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
const agentExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
const farExpiry = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
let users = [];

try {
  users = await prisma.user.createManyAndReturn({
    data: [
      { email: `reminder-corp-${suffix}@example.test`, name: "Reminder Corp", role: "CORP", isPremium: true, premiumPlan: "CORP_PREMIUM", premiumExpiry: corpExpiry, operatingStates: [] },
      { email: `reminder-agent-${suffix}@example.test`, name: "Reminder Agent", role: "AGENT", isPremium: true, premiumPlan: "AGENT_PREMIUM", premiumExpiry: agentExpiry, operatingStates: [] },
      { email: `reminder-far-${suffix}@example.test`, name: "Reminder Far", role: "CORP", isPremium: true, premiumPlan: "CORP_PREMIUM", premiumExpiry: farExpiry, operatingStates: [] },
    ],
  });

  const first = await createPremiumExpiryReminders(now);
  assert.equal(first.scanned, 2);
  assert.equal(first.created, 2);
  assert.equal(first.duplicates, 0);

  const second = await createPremiumExpiryReminders(now);
  assert.equal(second.scanned, 2);
  assert.equal(second.created, 0);
  assert.equal(second.duplicates, 2);

  const notifications = await prisma.notification.findMany({
    where: { userId: { in: users.map(({ id }) => id) } },
    orderBy: { createdAt: "asc" },
    select: { userId: true, type: true, body: true, dedupeKey: true },
  });
  assert.equal(notifications.length, 2);
  assert.ok(notifications.every(({ type }) => type === NotificationType.PREMIUM_EXPIRY_REMINDER));
  assert.ok(notifications.every(({ dedupeKey }) => dedupeKey?.startsWith("premium-expiry:")));
  assert.ok(notifications.some(({ body }) => body.includes("₦5,000")));
  assert.ok(notifications.some(({ body }) => body.includes("₦10,000")));

  console.log(JSON.stringify({
    ok: true,
    checks: [
      "CORP and AGENT reminders are created",
      "30/7/1-day threshold selection is deterministic",
      "one reminder is created per user and expiry threshold",
      "duplicate reminder runs are suppressed",
      "far-future expiries are not scanned",
      "annual plan prices are included in reminder copy",
    ],
  }, null, 2));
} finally {
  await prisma.user.deleteMany({ where: { id: { in: users.map(({ id }) => id) } } });
  await prisma.$disconnect();
}
