import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { changePasswordForUser } from "../src/lib/passwordChange.ts";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required; use an isolated test database.");

const prisma = new PrismaClient();
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const currentPassword = "Current-password-for-test-1";
const corpNewPassword = "Corp-new-password-for-test-2";
const agentNewPassword = "Agent-new-password-for-test-3";
let corpUser;
let agentUser;

try {
  const currentHash = await bcrypt.hash(currentPassword, 12);
  [corpUser, agentUser] = await Promise.all([
    prisma.user.create({
      data: { email: `password-corp-${suffix}@example.test`, name: "Password Corp", role: "CORP", password: currentHash, operatingStates: [] },
    }),
    prisma.user.create({
      data: { email: `password-agent-${suffix}@example.test`, name: "Password Agent", role: "AGENT", password: currentHash, operatingStates: [] },
    }),
  ]);

  await prisma.session.createMany({
    data: [
      { sessionToken: `password-corp-session-${suffix}`, userId: corpUser.id, expires: new Date(Date.now() + 60 * 60 * 1000) },
      { sessionToken: `password-agent-session-${suffix}`, userId: agentUser.id, expires: new Date(Date.now() + 60 * 60 * 1000) },
    ],
  });

  await assert.rejects(
    changePasswordForUser(corpUser.id, { currentPassword: "wrong-current", newPassword: corpNewPassword, confirmPassword: corpNewPassword }),
    /Current password is incorrect/,
  );
  await assert.rejects(
    changePasswordForUser(agentUser.id, { currentPassword, newPassword: agentNewPassword, confirmPassword: "different-password" }),
    /New passwords do not match/,
  );

  await changePasswordForUser(corpUser.id, { currentPassword, newPassword: corpNewPassword, confirmPassword: corpNewPassword });
  await changePasswordForUser(agentUser.id, { currentPassword, newPassword: agentNewPassword, confirmPassword: agentNewPassword });

  const [updatedCorp, updatedAgent, remainingSessions] = await Promise.all([
    prisma.user.findUnique({ where: { id: corpUser.id }, select: { password: true, sessionVersion: true } }),
    prisma.user.findUnique({ where: { id: agentUser.id }, select: { password: true, sessionVersion: true } }),
    prisma.session.count({ where: { userId: { in: [corpUser.id, agentUser.id] } } }),
  ]);

  assert.ok(updatedCorp?.password && updatedCorp.password !== currentHash);
  assert.ok(updatedAgent?.password && updatedAgent.password !== currentHash);
  assert.equal(await bcrypt.compare(corpNewPassword, updatedCorp.password), true);
  assert.equal(await bcrypt.compare(agentNewPassword, updatedAgent.password), true);
  assert.equal(updatedCorp.sessionVersion, 1);
  assert.equal(updatedAgent.sessionVersion, 1);
  assert.equal(remainingSessions, 0);

  console.log(JSON.stringify({
    ok: true,
    roles: ["CORP", "AGENT"],
    checks: [
      "wrong current password is rejected",
      "mismatched confirmation is rejected",
      "CORP password is rehashed and persisted",
      "AGENT password is rehashed and persisted",
      "sessionVersion increments for both accounts",
      "stored sessions are revoked for both accounts",
    ],
  }, null, 2));
} finally {
  await prisma.user.deleteMany({ where: { id: { in: [corpUser?.id, agentUser?.id].filter(Boolean) } } });
  await prisma.$disconnect();
}
