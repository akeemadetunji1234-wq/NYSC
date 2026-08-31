# Pre-launch Vercel Secrets and End-to-End Test Runbook

**Project:** Neat & Affordable  
**Platform:** Vercel + Next.js  
**Email:** Resend transactional delivery and Cloudflare Email Routing  
**Payments:** Paystack, test mode first

## 1. Vercel environment-variable security

Vercel encrypts environment-variable values at rest, but anyone with sufficient project access may still be able to use or manage them. Treat project access as production access. Vercel supports Sensitive variables whose values cannot be read after creation and whose values are redacted in build logs under the documented conditions.[1] [2]

Create secrets at the **project** level rather than team-wide unless multiple projects genuinely need them. Scope each value to the smallest environment:

| Variable | Production | Preview | Development | Exposure |
|---|---:|---:|---:|---|
| `PAYSTACK_SECRET_KEY` | Live key only when approved | Test key or absent | Test key in local secret file | Server-only, Sensitive |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Live public key only when approved | Test public key | Test public key | Browser-visible by design |
| `RESEND_API_KEY` | Production key | Separate restricted test/preview key | Local test key | Server-only, Sensitive |
| `NEXTAUTH_SECRET` | Production-only secret | Separate preview secret | Separate local secret | Server-only, Sensitive |
| `NEXTAUTH_URL` | Canonical production HTTPS URL | Preview URL | Local URL | Non-secret configuration |
| `RESEND_FROM_EMAIL` | Verified sending address | Test verified address | Mock/test address | Non-secret configuration |

Use the Vercel dashboard’s **Sensitive** option for production and preview secrets. Do not put secrets in `NEXT_PUBLIC_*` variables, source files, client components, browser storage, URLs, query strings, screenshots, issue tickets, analytics events, or logs. Public Paystack keys are intentionally client-visible; Paystack secret keys are backend-only.[3]

Keep separate keys for test and live modes. Name keys by purpose and environment, restrict Resend keys to the required domain and permission where supported, and restrict Vercel project/team membership. Enable 2FA for Vercel, Paystack, Resend, the domain registrar, and the mailbox used for recovery.

Any environment-variable change applies only to new deployments. After adding or editing a variable, create a new deployment and verify the deployment environment. Never print a secret to prove that it loaded; use a boolean presence check and a provider API call whose response is sanitized.

## 2. Safe rotation procedure

When rotating a key, create the replacement first, update the correct Vercel environment, deploy, run a sanitized health check, then revoke the old key. For `NEXTAUTH_SECRET`, rotation invalidates existing encrypted JWT sessions; plan a user re-login window. For Paystack and Resend, monitor provider error responses and delivery/payment events before deleting the previous credential.

If a secret may have been exposed, do not wait for the next routine rotation: revoke or rotate it at the provider, replace the Vercel value, redeploy, inspect provider usage logs, and review Git history and build logs. Do not paste the exposed value into a report.

## 3. End-to-end test stages

Run these stages in order. Use a disposable test mailbox, isolated test accounts, Paystack test mode, and a separate preview or test deployment. Do not use production customers, real payment cards, live money, or real production writes.

### Stage A — DNS and domain preflight

Confirm that Cloudflare is authoritative for `neatandaffordable.com`. Confirm the intended root MX design for Cloudflare Email Routing and ensure there is no competing mailbox MX configuration. Confirm the Resend sending subdomain, such as `updates.neatandaffordable.com`, has the exact provider-generated SPF/DKIM records.

Run read-only checks:

```bash
dig NS neatandaffordable.com
dig MX neatandaffordable.com
dig TXT neatandaffordable.com
dig TXT updates.neatandaffordable.com
dig TXT _dmarc.neatandaffordable.com
```

Confirm there is only one SPF policy for each exact domain or subdomain and one DMARC record at `_dmarc.neatandaffordable.com`.

### Stage B — Cloudflare Email Routing

1. In Cloudflare, confirm Email Routing is enabled for `neatandaffordable.com`.
2. Confirm the destination inbox is verified.
3. Confirm the `support` routing rule forwards to the intended destination.
4. From a separate test sender, email `support@neatandaffordable.com`.
5. Confirm delivery, sender preservation, spam behavior, and support response handling.
6. Confirm that no sensitive information is included in automatic forwarding or test subjects.

Do not treat forwarding as proof that Resend outbound delivery works. They are separate paths.

### Stage C — Website and Vercel domain

1. Add `neatandaffordable.com` and, if desired, `www.neatandaffordable.com` under Vercel Project Settings → Domains.
2. Copy the exact Vercel A/CNAME instructions into Cloudflare DNS.
3. Keep the web records DNS-only initially.
4. Wait until Vercel reports the domain as configured and its HTTPS certificate is valid.
5. Confirm the canonical hostname and redirect behavior.
6. Load the home page, sign-in, sign-up, verification, marketplace, dashboard, and logout pages over HTTPS.
7. Confirm no mixed-content warning, console secret, source-map secret, directory listing, or publicly cached authenticated page.
8. Confirm session cookies have the intended Secure, HttpOnly, SameSite, host-only, and Path attributes.
9. Confirm OAuth and password-reset links use the canonical HTTPS host and reject unsafe external redirects.

### Stage D — Resend transactional delivery

1. Use a Resend test or restricted key in the preview/test environment.
2. Send an email verification message to a disposable test address.
3. Complete verification and confirm registration uses server-side verification state.
4. Request a password reset and confirm the message arrives without account-enumeration detail.
5. Test booking confirmation, saved-search notification, security alert, and payment receipt templates.
6. Inspect message headers for `spf=pass`, `dkim=pass`, and `dmarc=pass`.
7. Confirm bounce, complaint, and failed-delivery events are recorded safely.
8. Confirm Resend’s delivery logs contain no API key, password, OTP, reset token, or full session token.
9. Confirm the application handles a provider timeout, 4xx response, 5xx response, and rate limit without exposing provider secrets or falsely reporting delivery success.

### Stage E — Paystack test-mode checkout

Paystack provides separate test and live keys. Use only `pk_test_` and `sk_test_` credentials for pre-launch testing; test mode does not move real money.[3]

1. Configure the test public key only where the browser SDK requires it.
2. Keep the test secret key only in server-side Vercel/preview environment variables.
3. Initialize a premium transaction using server-controlled pricing: Corp ₦5,000/year and Agent ₦10,000/year.
4. Use an internal order/reference record tied to the authenticated user and selected plan.
5. Complete a Paystack test payment.
6. Treat the browser callback as untrusted input and verify the reference server-side through Paystack’s Verify Transaction API.[4]
7. Confirm the server checks reference, amount, currency, plan, user, and successful transaction status before granting premium.
8. Deliver the premium entitlement idempotently; repeated callbacks or webhooks must not extend or duplicate the entitlement.
9. Configure the public webhook URL and validate `x-paystack-signature` with HMAC SHA-512 before processing.[5]
10. Acknowledge valid webhooks quickly with HTTP 200, then perform bounded asynchronous work. Handle duplicates, out-of-order events, failed payments, abandoned payments, reversals, refunds, and malformed signatures.
11. Confirm payment records and entitlement state can be reconciled against Paystack references.
12. Confirm no property rent, deposit, agent payout, escrow, or transfer is enabled merely because premium checkout succeeds.

Paystack recommends webhooks for reliable status updates and documents retries when a webhook is not acknowledged with HTTP 200.[5]

### Stage F — Failure and abuse tests

Test missing or malformed environment variables in a disposable preview deployment. Test an untrusted Origin, invalid webhook signature, reused payment reference, amount mismatch, currency mismatch, wrong user, expired verification token, reset-token reuse, duplicate email send, Resend 429, and Paystack 5xx. Each must fail closed without leaking provider details or changing entitlement state.

Rate-limit authentication, verification, reset, webhook, upload, and payment initialization paths. Do not create attacker-triggerable permanent account lockouts. Log event type, outcome, correlation/reference ID, and safe metadata, but never secrets or raw tokens.

## 4. Launch gate checklist

| Gate | Pass condition |
|---|---|
| Secret hygiene | No private key in Git, client bundle, source map, URL, log, or screenshot. |
| Vercel scope | Production secrets are Sensitive and production-only; preview uses isolated values. |
| Domain | Apex and chosen canonical host resolve to Vercel over HTTPS. |
| Email routing | `support@` reaches the verified destination from an independent sender. |
| Email authentication | Resend messages pass SPF, DKIM, and DMARC. |
| Resend reliability | Failures, bounces, rate limits, and timeouts are handled without false success. |
| Paystack | Test payment verification and signed webhook processing are server-side and idempotent. |
| Entitlements | Only a verified successful transaction grants annual premium; no property money flow is enabled. |
| Authorization | User, agent, and admin isolation tests pass; client flags cannot grant privileges. |
| Recovery | Password reset, session revocation, logout, and secret-rotation behavior are tested. |
| Observability | Safe security/payment/email events are searchable and alertable without sensitive payloads. |
| Operations | Refund, dispute, support, takedown, reconciliation, and incident owners are assigned. |

## References

[1]: https://vercel.com/docs/environment-variables "Vercel — Environment variables"

[2]: https://vercel.com/docs/environment-variables/sensitive-environment-variables "Vercel — Sensitive environment variables"

[3]: https://paystack.com/docs/api/authentication/ "Paystack — Authentication and API keys"

[4]: https://paystack.com/docs/payments/verify-payments/ "Paystack — Verify payments"

[5]: https://paystack.com/docs/payments/webhooks/ "Paystack — Webhooks"
