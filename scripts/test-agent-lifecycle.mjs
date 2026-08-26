import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { getAgentPostingError } from "../src/lib/agentPosting.ts";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required; use an isolated test database.");
const prisma = new PrismaClient();
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let agent;

try {
  agent = await prisma.user.create({
    data: {
      email: `lifecycle-agent-${suffix}@example.test`,
      name: "Lifecycle Test Agent",
      role: "AGENT",
      agentVerified: false,
      verificationStatus: "UNVERIFIED",
      operatingStates: [],
    },
  });

  assert.equal(getAgentPostingError({ agentVerified: false, isBanned: false, verificationStatus: "UNVERIFIED" }), "UNVERIFIED_AGENT");

  const activated = await prisma.user.update({
    where: { id: agent.id },
    data: { agentVerified: true, agentVerifiedAt: new Date(), verificationStatus: "VERIFIED", isBanned: false },
    select: { agentVerified: true, isBanned: true, verificationStatus: true },
  });
  assert.equal(getAgentPostingError(activated), null);

  const deactivated = await prisma.user.update({
    where: { id: agent.id },
    data: { agentVerified: false, agentVerifiedAt: null, verificationStatus: "DEACTIVATED", isBanned: false },
    select: { agentVerified: true, isBanned: true, verificationStatus: true },
  });
  assert.equal(getAgentPostingError(deactivated), "INACTIVE_AGENT");

  const reactivated = await prisma.user.update({
    where: { id: agent.id },
    data: { agentVerified: true, agentVerifiedAt: new Date(), verificationStatus: "VERIFIED", isBanned: false },
    select: { agentVerified: true, isBanned: true, verificationStatus: true },
  });
  assert.equal(getAgentPostingError(reactivated), null);

  console.log(JSON.stringify({
    ok: true,
    checks: [
      "unverified agents are blocked",
      "activated agents may post",
      "deactivated agents are banned from posting",
      "reactivated agents may post again",
    ],
  }, null, 2));
} finally {
  if (agent?.id) await prisma.user.deleteMany({ where: { id: agent.id } });
  await prisma.$disconnect();
}
