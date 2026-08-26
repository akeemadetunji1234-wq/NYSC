import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required; use an isolated test database.");
process.env.PAYSTACK_SECRET_KEY = "sk_test_nysc_paystack_fixture";

const [{ PrismaClient }, paystack] = await Promise.all([
  import("@prisma/client"),
  import("../src/lib/paystack.ts"),
]);

const prisma = new PrismaClient();
const email = `paystack-test-${randomUUID()}@example.com`;
let userId;

try {
  const signaturePayload = JSON.stringify({ event: "charge.success", data: { reference: "nysc-test-reference" } });
  const signature = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(signaturePayload).digest("hex");
  assert.equal(paystack.verifyPaystackWebhookSignature(signaturePayload, signature), true);
  assert.equal(paystack.verifyPaystackWebhookSignature(signaturePayload, `${signature.slice(0, -1)}0`), false);
  assert.equal(paystack.verifyPaystackWebhookSignature(signaturePayload, null), false);
  assert.equal(paystack.verifyPaystackWebhookSignature(`${signaturePayload}x`, signature), false);

  const user = await prisma.user.create({
    data: { email, name: "Paystack Test", role: "CORP", emailVerified: new Date() },
  });
  userId = user.id;
  const payment = await prisma.premiumPayment.create({
    data: {
      userId,
      provider: "PAYSTACK",
      reference: `nysc-${randomUUID()}`,
      plan: "CORP_PREMIUM",
      amount: 5_000,
      currency: "NGN",
    },
  });

  let verifyCalls = 0;
  globalThis.fetch = async (url) => {
    verifyCalls += 1;
    assert.match(String(url), /transaction\/verify/);
    return new Response(JSON.stringify({
      status: true,
      message: "Verification successful",
      data: {
        id: 123456789,
        status: "success",
        reference: payment.reference,
        amount: 500_000,
        currency: "NGN",
        paid_at: new Date().toISOString(),
        customer: { email },
      },
    }), { status: 200, headers: { "content-type": "application/json" } });
  };

  const activated = await paystack.verifyAndActivatePaystackPayment(payment.reference);
  assert.equal(activated.success, true);
  assert.equal(activated.alreadyProcessed, false);
  assert.equal(activated.plan, "CORP_PREMIUM");
  assert.ok(new Date(activated.expiresAt).getTime() > Date.now() + 364 * 24 * 60 * 60 * 1000);

  const second = await paystack.verifyAndActivatePaystackPayment(payment.reference);
  assert.equal(second.success, true);
  assert.equal(second.alreadyProcessed, true);
  assert.equal(verifyCalls, 1);

  const [storedPayment, storedUser] = await Promise.all([
    prisma.premiumPayment.findUnique({ where: { id: payment.id } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);
  assert.equal(storedPayment?.status, "SUCCESS");
  assert.equal(storedPayment?.providerTransactionId, "123456789");
  assert.equal(storedUser?.isPremium, true);
  assert.equal(storedUser?.premiumPlan, "CORP_PREMIUM");
  assert.ok(storedUser?.premiumExpiry);

  const mismatchUser = await prisma.user.create({
    data: { email: `paystack-mismatch-${randomUUID()}@example.com`, name: "Mismatch Test", role: "AGENT", emailVerified: new Date() },
  });
  const mismatchPayment = await prisma.premiumPayment.create({
    data: { userId: mismatchUser.id, provider: "PAYSTACK", reference: `nysc-${randomUUID()}`, plan: "AGENT_PREMIUM", amount: 10_000, currency: "NGN" },
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    verifyCalls += 1;
    const isMismatch = String(url).endsWith(encodeURIComponent(mismatchPayment.reference));
    return new Response(JSON.stringify({ status: true, message: "Verification successful", data: {
      id: isMismatch ? 987654321 : 123456789,
      status: "success",
      reference: isMismatch ? mismatchPayment.reference : payment.reference,
      amount: isMismatch ? 999_999 : 500_000,
      currency: "NGN",
      paid_at: new Date().toISOString(),
      customer: { email: isMismatch ? mismatchUser.email : email },
    } }), { status: 200, headers: { "content-type": "application/json" } });
  };
  await assert.rejects(() => paystack.verifyAndActivatePaystackPayment(mismatchPayment.reference), /verification failed/i);
  const mismatchUserAfter = await prisma.user.findUnique({ where: { id: mismatchUser.id }, select: { isPremium: true } });
  assert.equal(mismatchUserAfter?.isPremium, false);
  await prisma.premiumPayment.delete({ where: { id: mismatchPayment.id } });
  await prisma.user.delete({ where: { id: mismatchUser.id } });
  globalThis.fetch = originalFetch;

  console.log(JSON.stringify({ ok: true, signature: "passed", activation: "passed", idempotency: "passed", mismatchRejected: "passed" }));
} finally {
  if (userId) await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  await prisma.$disconnect();
}
