import assert from "node:assert/strict";

process.env.PAYSTACK_SECRET_KEY = "sk_test_paystack_fixture";
process.env.NEXTAUTH_URL = "https://auth.example.test/";
process.env.PAYSTACK_CALLBACK_URL = "https://payments.example.test/";

const { initializePaystackTransaction } = await import("../src/lib/paystack.ts");
let requestBody;
let requestUrl;

globalThis.fetch = async (url, init) => {
  requestUrl = String(url);
  requestBody = JSON.parse(String(init?.body));
  return new Response(JSON.stringify({
    status: true,
    message: "Authorization URL created",
    data: {
      authorization_url: "https://checkout.paystack.com/fixture",
      access_code: "fixture-access-code",
      reference: "nysc-fixture-reference",
    },
  }), { status: 200, headers: { "content-type": "application/json" } });
};

const result = await initializePaystackTransaction({
  email: "member@example.test",
  amountNaira: 5000,
  reference: "nysc-fixture-reference",
  plan: "CORP_PREMIUM",
  paymentId: "payment-fixture-id",
});

assert.equal(requestUrl, "https://api.paystack.co/transaction/initialize");
assert.equal(requestBody.amount, "500000");
assert.equal(requestBody.currency, "NGN");
assert.equal(requestBody.callback_url, "https://payments.example.test/api/payments/paystack/callback");
assert.deepEqual(JSON.parse(requestBody.metadata), { paymentId: "payment-fixture-id", plan: "CORP_PREMIUM" });
assert.equal(result.authorizationUrl, "https://checkout.paystack.com/fixture");

await assert.rejects(
  () => initializePaystackTransaction({ email: "member@example.test", amountNaira: 0, reference: "nysc-fixture-reference", plan: "CORP_PREMIUM", paymentId: "payment-fixture-id" }),
  /positive whole number/,
);

console.log(JSON.stringify({ ok: true, payload: "passed", callbackUrl: "passed", amountValidation: "passed" }));
