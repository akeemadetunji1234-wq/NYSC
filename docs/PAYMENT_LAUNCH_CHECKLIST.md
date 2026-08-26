# Paystack Launch Checklist

**Status:** Draft for business and legal review  
**Application:** Neat & Affordable / NYSC  
**Provider:** Paystack  
**Plans:** Corp Member Premium — NGN 5,000 per calendar year; Agent Premium — NGN 10,000 per calendar year

> This checklist prepares the application for a controlled Paystack launch. It does not authorize a live payment, represent legal advice, or replace Paystack’s account-review and compliance requirements.

## 1. Business and account readiness

| Check | Owner | Status |
|---|---|---|
| Paystack business/account review approved | Business owner | Pending provider review |
| Settlement bank account verified in Paystack | Business owner | Pending |
| Business identity and required compliance documents accepted | Business owner | Pending |
| Public support contact and escalation owner confirmed | Business owner | Pending |
| Refund and cancellation policy reviewed by the business/legal adviser | Business owner/legal adviser | Pending |
| Terms of service and privacy notice reviewed and published | Business owner/legal adviser | Pending |

## 2. Vercel configuration

Add secrets directly in the Vercel project’s Production environment. Never send them through chat, commit them to Git, or expose them to client-side code.

| Variable | Test-mode value | Live-mode value | Required |
|---|---|---|---|
| `PAYSTACK_SECRET_KEY` | Paystack `sk_test_...` key | Paystack `sk_live_...` key | Yes for checkout/webhooks |
| `NEXTAUTH_URL` | Production application URL | Production application URL | Yes for callback construction |
| `DATABASE_URL` | Production database URL | Production database URL | Yes for entitlement persistence |
| `CRON_SECRET` | Existing protected cron secret | Existing protected cron secret | Yes for scheduled jobs |

After adding or changing a Production variable, trigger a fresh Vercel deployment. Do not assume a previous deployment has received a newly added variable.

## 3. Paystack dashboard configuration

Configure the webhook endpoint exactly as follows:

```text
https://nysc-mu.vercel.app/api/payments/paystack/webhook
```

The application callback endpoint is:

```text
https://nysc-mu.vercel.app/api/payments/paystack/callback
```

Paystack sends the `x-paystack-signature` header as an HMAC-SHA512 signature over the raw request body. The application validates that signature, re-verifies the transaction with Paystack, and processes the event idempotently [1] [2].

## 4. Controlled test-mode runbook

Use a Paystack test key first. Create one test Corp Member account and one test Agent account with verified synthetic email addresses. Confirm the following for each role:

| Test | Expected result |
|---|---|
| Correct annual plan displayed | Corp shows NGN 5,000; Agent shows NGN 10,000 |
| Browser changes amount or plan | Server ignores the tampered value and uses the authenticated role’s server-side price |
| Checkout initialization | A pending Paystack payment record is created with a unique reference |
| Successful test payment | Provider verification confirms status, reference, NGN currency, amount, and customer email |
| Premium activation | Only verified success sets premium status, plan, start time, and one-year expiry |
| Duplicate callback/webhook | No duplicate entitlement or duplicate notification is created |
| Cancelled checkout | Account remains non-premium and the user sees a retry/cancelled state |
| Failed payment | Account remains non-premium and the user sees a safe failure state |
| Wrong amount or currency | Verification fails and premium is not activated |
| Invalid webhook signature | Request is rejected with HTTP 401 |
| Missing Paystack configuration | Checkout is unavailable safely; no provider call is attempted |
| Admin reconciliation | The payment appears with safe metadata and the correct status |
| Database restart/retry | The callback or webhook can be retried without double fulfillment |

Paystack recommends server-side verification and warns against fulfilling an order from the browser redirect alone. The application follows that model by treating the callback as a verification trigger and the webhook as a durable provider event [1].

## 5. Production cutover

Switch to live mode only after the business account is approved and all test-mode checks pass. Add the live secret directly in Vercel, redeploy, verify that the production health/monitoring view reports Paystack configured without exposing the value, and perform one small controlled live transaction if the business owner authorizes it.

The first live transaction should be reconciled against the Paystack dashboard and the application’s Admin Payments page. Confirm the user’s exact plan, amount, payment reference, provider transaction ID, premium start date, and one-year expiry before accepting broader traffic.

## 6. Monitoring and incident response

Monitor the Paystack webhook for signature failures, provider verification failures, repeated references, unexpected currency or amount mismatches, and delayed event delivery. Review the Admin Production Monitoring and Premium Payments pages after the first test and after the first live transaction.

If a provider or database issue occurs, disable checkout by removing or disabling the application’s Paystack secret, keep existing verified entitlements intact, and reconcile affected references manually. Do not grant premium manually unless the payment is independently confirmed in Paystack and the action is recorded in the audit trail.

## References

[1]: https://paystack.com/docs/api/transaction/ "Paystack Transaction API"
[2]: https://paystack.com/docs/payments/webhooks/ "Paystack Webhooks"
