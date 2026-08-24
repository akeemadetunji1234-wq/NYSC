import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { assertOwnerOrAdmin, assertRole } from "../src/lib/authorization.ts";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required; use an isolated test database.");
const prisma = new PrismaClient();
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let userA;
let userB;
try {
  userA = await prisma.user.create({ data: { email: `policy-a-${suffix}@example.test`, name: "Policy A", role: "CORP", operatingStates: [] } });
  userB = await prisma.user.create({ data: { email: `policy-b-${suffix}@example.test`, name: "Policy B", role: "CORP", operatingStates: [] } });

  assert.doesNotThrow(() => assertOwnerOrAdmin({ id: userA.id, role: userA.role }, userA.id));
  assert.throws(() => assertOwnerOrAdmin({ id: userA.id, role: userA.role }, userB.id), /Forbidden/);
  assert.throws(() => assertRole({ id: userA.id, role: userA.role }, "ADMIN"), /Forbidden/);
  assert.doesNotThrow(() => assertRole({ id: userB.id, role: userB.role }, "CORP"));

  console.log(JSON.stringify({
    ok: true,
    accounts: 2,
    checks: [
      "owner can access own record",
      "account A cannot access account B record",
      "normal account cannot satisfy ADMIN role",
      "CORP role remains permitted for CORP workflow",
    ],
  }, null, 2));
} finally {
  await prisma.user.deleteMany({ where: { id: { in: [userA?.id, userB?.id].filter(Boolean) } } });
  await prisma.$disconnect();
}
