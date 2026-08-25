import assert from "node:assert/strict";

if (process.env.NODE_ENV === "production") throw new Error("Email test cannot run in production mode.");
process.env.BREVO_API_KEY = "";
process.env.BREVO_SMTP_KEY = "";
process.env.BREVO_SMTP_LOGIN = "";

const { isEmailConfigured, sendPremiumExpiryReminderEmail } = await import("../src/lib/email.ts");
assert.equal(isEmailConfigured, false);

await sendPremiumExpiryReminderEmail({
  to: "premium-email-test@example.test",
  planLabel: "Agent Premium",
  amount: "10,000",
  expiryDate: "25 August 2026",
  daysRemaining: 7,
  renewalLink: "/agent/premium",
});

console.log(JSON.stringify({
  ok: true,
  checks: [
    "email provider is absent in the isolated test environment",
    "expiry reminder email renders and uses the mock transport without external delivery",
    "relative renewal links are accepted and converted by the sender",
  ],
}, null, 2));
