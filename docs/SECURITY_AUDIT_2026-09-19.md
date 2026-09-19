# NYSC Security Audit — 19 September 2026

## Executive assessment

The NYSC application has a strong security foundation for a marketplace at this stage. Authentication, role separation, redirect protection, request-size limits, content-security policy, HSTS, webhook signature verification, SSRF protections, upload validation, and ownership checks are present. The application also has automated security tests covering session tampering, token expiry, authorization scope, CORS, redirects, SSRF, security headers, file paths, upload limits, and booking concurrency.

The current overall grade is **B+ (84/100)**. The grade reflects good application-layer controls and a clean dependency audit, reduced by production hardening gaps that cannot be solved only in source code. The largest operational gap is that production does not currently show Upstash distributed-rate-limit variables. Without them, the application falls back to an in-memory limiter that is not shared across Vercel instances. The largest account-security gap is the lack of multi-factor authentication and step-up authentication for administrators.

No critical vulnerability was found in this review. Two authorization issues were identified and fixed during the audit: administrators could authorize a Pusher subscription to an arbitrary user channel, and a logged-in user could attempt to reassign an existing push endpoint to their account. Both fixes were applied locally, type-checked, and pushed in the latest security-hardening commit.

## Grade breakdown

| Area | Score | Assessment |
|---|---:|---|
| Authentication and session security | 18/20 | Short-lived seven-day JWT sessions, secure cookies, session-version revocation, banned-user checks, login friction, and OAuth state binding are present. MFA is not yet present. |
| Authorization and tenant isolation | 18/20 | Role guards and ownership filters are broadly consistent. The Pusher arbitrary-channel issue found in the audit was fixed. Continued expansion of automated object-level authorization tests is recommended. |
| Input, upload, and SSRF protection | 17/20 | Zod validation, request limits, upload magic-byte checks, Cloudinary host validation, safe outbound fetch, and SSRF tests are present. Image decompression and malware scanning are not implemented. |
| Web, API, and browser security | 18/20 | CSP nonces, HSTS, frame denial, MIME protection, referrer policy, same-origin controls, and restrictive CORS are present. Security headers should remain regression-tested after framework upgrades. |
| Operations and third-party risk | 13/20 | Dependency audit is clean and runtime errors were absent in the last 24 hours. Distributed rate limiting, real provider transaction evidence, inbox evidence, and admin MFA remain incomplete. |
| **Overall** | **84/100 — B+** | Suitable for continued controlled launch work, but not yet at a high-assurance or regulated-production standard. |

## Evidence collected

The production deployment responded with successful health and security headers. The live response included a nonce-based CSP, `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and restrictive permissions policy. The public Web Push configuration endpoint returned only the public VAPID key and did not expose the private key.

The production Vercel configuration contains entries for Paystack, Pusher, Brevo, Mapbox, and VAPID. Secret values were not decrypted or copied into this report. The environment listing did not show Upstash Redis variables, so distributed rate limiting is not confirmed in production.

`pnpm audit --prod` reported **zero info, low, moderate, high, or critical vulnerabilities** across 579 production dependencies. The following security suites passed after the test environment was supplied with an isolated `NEXTAUTH_SECRET`: security boundaries, security scope, security headers, and security-file redirect/SSRF tests. The Paystack webhook and simulated activation suite also passed, as did the Brevo mock email rendering test.

Vercel runtime error aggregation reported **no runtime errors in the selected 24-hour window**. No Pusher, Web Push, Brevo, or Paystack event was found in the queried window, so the absence of errors must not be interpreted as proof that a real user received a notification or email.

## Findings and attack paths

### 1. Production rate limiting is not distributed — high priority

The application has a bounded in-memory fallback when Upstash is not configured. This works within one function instance but can be bypassed by distributing requests across Vercel instances. An attacker could rotate requests across instances to increase password, OTP, upload, message, or webhook pressure.

**Impact:** Increased brute-force, abuse, and denial-of-service capacity. This is not an authentication bypass by itself.

**Remediation:** Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for production. Keep the current timeout and fallback behavior, but alert administrators when the distributed limiter is unavailable. Add a deployment readiness check that fails or warns when production rate limiting is local-only.

### 2. Administrator MFA is absent — high priority

Administrative routes are protected by role-based sessions, but the review did not find a second factor or step-up challenge for sensitive actions such as user management, exports, verification decisions, payment administration, and safety administration.

**Impact:** A stolen administrator session or password would provide broad access.

**Remediation:** Add TOTP or WebAuthn MFA for administrators. Require recent MFA verification for NDPR exports, provider configuration, role changes, payout/payment administration, and support-view access. Record MFA enrollment, recovery, and step-up events in the audit log.

### 3. Real provider and device evidence is incomplete — medium priority

The source code and configuration paths exist for Pusher, Brevo, Paystack, Web Push, and Mapbox. However, a real Pusher browser event, real Web Push delivery while an iPhone PWA is closed, real Brevo inbox delivery, and a real Paystack test transaction were not independently observed.

**Impact:** Integration failure, misrouted notifications, template rejection, webhook mismatch, or provider-console misconfiguration could remain undetected.

**Remediation:** Maintain a controlled staging account for each role, a dedicated test inbox, a Paystack test-mode payment method, and a recurring provider smoke test. Record notification IDs, payment references, inbox timestamps, and device results without storing payment credentials.

### 4. Upload pipeline has strong validation but no content quarantine — medium priority

The Cloudinary route checks role, agent verification, same-origin requests, content length, MIME type, file signatures, batch count, IP/user limits, outbound host, HTTPS response, and Cloudinary path. It does not perform malware scanning, image re-encoding, or a server-side pixel-dimension/decompression-bomb check before handing the file to the provider.

**Impact:** Resource exhaustion or malicious image payloads are possible in edge cases, although Cloudinary reduces local storage exposure.

**Remediation:** Add a maximum pixel-dimension check and server-side image re-encoding using a maintained image library or provider transformation. Use signed upload parameters where practical, quarantine new uploads until moderation, and apply Cloudinary transformation limits.

### 5. Admin support access needs stronger step-up controls — medium priority

The application correctly uses a read-only support view rather than unrestricted session impersonation. The action is audit logged, which is safer than silently acting as another user. Because the view exposes personal data, it should require an explicit support reason, recent MFA, least-privilege scope, and automatic expiry of the viewing session.

**Remediation:** Add reason capture, ticket/reference ID, time-limited signed support links, field minimization, and an immutable audit event containing actor, target, reason, timestamp, and fields viewed.

### 6. Email and notification content should remain privacy-minimized — low to medium priority

Message notification previews are truncated and email delivery is throttled. The system should continue to avoid putting sensitive property, identity, or safety details in push and email bodies because notification surfaces may be visible on lock screens.

**Remediation:** Add a user preference for sensitive-preview suppression and default lock-screen messages to generic text such as “You have a new message in NYSC Housing.”

## Controls that are working well

The application rejects hostile origins and does not reflect arbitrary origins. CSP tests confirm nonces, no `unsafe-eval`, no unsafe inline styles, explicit resource directives, and frame protections. HSTS and MIME protections are live.

The OAuth flow has state binding and single-use checks. Callback URLs are restricted to approved same-origin paths, including encoded and protocol-relative bypass cases. Session cookies use secure settings in production, and database session-version changes invalidate old JWTs.

Paystack webhooks verify the provider signature before parsing the event, validate the event type and reference format, and perform server-side payment verification. The simulated payment suite checks idempotency and rejects mismatched amounts or plans.

Object-level authorization is present across core booking, viewing, report, safety, rent-schedule, property, and message actions. Uploads require an active verified agent and use server-generated file identifiers rather than trusting the client filename.

## Recommended next feature

The next feature should not be another marketplace surface. The highest-value addition is a **Security and Operations Center for administrators**. It should display distributed-rate-limit readiness, provider health, failed webhook counts, notification delivery failures, stale push subscriptions, recent security events, MFA enrollment status, and deployment health. It should include safe remediation actions such as deleting expired push subscriptions and rotating a provider integration through a controlled workflow.

This feature would make the remaining operational risks visible before they become user-facing incidents. It also provides a natural place to complete the provider smoke tests and security sign-off process.

## Priority plan

**Within the next deployment:** configure Upstash in production, add a production-readiness warning when the limiter is local-only, keep the two Pusher and push-subscription authorization fixes, and add regression tests for both cases.

**Next security sprint:** implement administrator MFA, step-up authorization for exports and support tools, reason-captured support access, and more object-level authorization tests for every admin mutation.

**Before broad launch:** run the real Pusher browser test, iPhone Web Push closed-app test, Brevo inbox test, Paystack test-mode transaction, and Safari/Firefox pass. Record results in a deployment verification log.

**Before legal sign-off:** review Privacy, Terms, and Safety wording against the real business process. Do not replace emergency fallbacks with state-specific numbers until each number has an authoritative source.

## References

[1]: https://owasp.org/www-project-application-security-verification-standard/ "OWASP Application Security Verification Standard"
[2]: https://owasp.org/www-project-top-ten/ "OWASP Top 10 Web Application Security Risks"
[3]: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy "Next.js Content Security Policy guidance"
[4]: https://developer.mozilla.org/en-US/docs/Web/API/Push_API "MDN Push API reference"
