import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { isSimulatedPaymentsEnabled, simulateAnnualPremiumForUser } from "../src/lib/premiumCheckout.ts";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required; use an isolated test database.");

process.env.SIMULATED_PAYMENTS_ENABLED = "true";
process.env.SIMULATED_PAYMENTS_ALLOW_PRODUCTION = "false";
if (process.env.NODE_ENV === "production") throw new Error("Simulated checkout test cannot run in production mode.");

const prisma = new PrismaClient();
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let users = [];

try {
  users = await prisma.user.createManyAndReturn({
    data: [
      { email: `checkout-corp-${suffix}@example.test`, name: "Checkout Corp", role: "CORP", operatingStates: [] },
      { email: `checkout-agent-${suffix}@example.test`, name: "Checkout Agent", role: "AGENT", operatingStates: [] },
    ],
  });

  assert.equal(isSimulatedPaymentsEnabled(), true);
  const corp = users.find(({ role }) => role === "CORP");
  const agent = users.find(({ role }) => role === "AGENT");
  assert.ok(corp && agent);

  const [corpResult, agentResult] = await Promise.all([
    simulateAnnualPremiumForUser(corp.id, "CORP_PREMIUM"),
    simulateAnnualPremiumForUser(agent.id, "AGENT_PREMIUM"),
  ]);

  assert.equal(corpResult.amount, 5_000);
  assert.equal(agentResult.amount, 10_000);
  assert.ok(new Date(corpResult.expiresAt).getTime() > Date.now() + 364 * 24 * 60 * 60 * 1000);
  assert.ok(new Date(agentResult.expiresAt).getTime() > Date.now() + 364 * 24 * 60 * 60 * 1000);

  await assert.rejects(
    simulateAnnualPremiumForUser(corp.id, "AGENT_PREMIUM"),
    /not available for the account role/,
  );

  const [updatedUsers, confirmations] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: [corp.id, agent.id] } }, select: { role: true, isPremium: true, premiumPlan: true, premiumSince: true, premiumExpiry: true } }),
    prisma.notification.findMany({ where: { userId: { in: [corp.id, agent.id] }, type: "PREMIUM_PAYMENT_SIMULATED" } }),
  ]);

  assert.equal(updatedUsers.length, 2);
  assert.ok(updatedUsers.every(({ isPremium, premiumPlan, premiumSince, premiumExpiry }) => isPremium && premiumPlan && premiumSince && premiumExpiry));
  assert.equal(confirmations.length, 2);

  process.env.SIMULATED_PAYMENTS_ENABLED = "false";
  assert.equal(isSimulatedPaymentsEnabled(), false);
  await assert.rejects(
    simulateAnnualPremiumForUser(corp.id, "CORP_PREMIUM"),
    /Simulated payments are disabled/,
  );

  console.log(JSON.stringify({
    ok: true,
    checks: [
      "simulated payments are enabled only by an explicit test flag",
      "CORP and AGENT plans use server-side prices",
      "simulated checkout persists one-year premium entitlements",
      "role mismatch is rejected",
      "payment confirmations are recorded",
      "disabling the toggle blocks simulated checkout",
    ],
  }, null, 2));
} finally {
  await prisma.user.deleteMany({ where: { id: { in: users.map(({ id }) => id) } } });
  await prisma.$disconnect();
}
