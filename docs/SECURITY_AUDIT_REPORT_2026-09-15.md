# Security Audit Report — Neat & Affordable / NYSC

**Audit date:** 15 September 2026  
**Repository:** `akeemadetunji1234-wq/NYSC`  
**Checkout:** `/home/ubuntu/NYSC`  
**Branch:** `main`  
**Audited commit:** `8ce1e50` (`Add premium budgeting safety emergency and rent features`)  
**Prepared by:** Manus AI

## Executive conclusion

The current branch presents a **strong application-level security baseline**. The reviewed authentication, authorization, redirect, upload, payment-verification, webhook, cron, middleware, and dependency controls are materially stronger than the older project overview suggests. No confirmed critical or high-severity source-code vulnerability was found during this review.

The project should not yet be described as fully security-verified in production. The main residual risks are **privacy exposure through bearer safety links**, **provider-side upload configuration**, **historical or unverified credential rotation**, and **missing database-backed authorization evidence in the current audit environment**. These items are actionable and should be resolved or explicitly accepted before launch sign-off.

The attached project update is also behind the current repository. It records commit `94bce2f` and 478 tracked files, while the current checkout is commit `8ce1e50` with 496 tracked files. Several UI issues listed as open in the update are now resolved in source: the admin safety page, agent viewings page, and admin partnerships page are present.

## Scope and evidence boundary

The review covered the source tree, Prisma schema, middleware, API routes, server actions, security libraries, payment flows, upload flows, cron handlers, repository configuration, the supplied project update, and the repository-provided security tests. No production credentials were accessed, no destructive database operation was performed, and no production write workflow was exercised.

Provider-side controls cannot be proven from the repository alone. In particular, Vercel Firewall and Bot Management, Cloudinary preset restrictions, Pusher configuration, email-provider credential rotation, deployment secret history, database backups, and production monitoring require evidence from the relevant provider consoles or deployment logs.

## Current validation results

| Check | Result | Interpretation |
|---|---|---|
| TypeScript no-emit check | **Passed** | `pnpm typecheck` completed successfully after installing the locked dependencies. |
| Production dependency audit | **Passed** | `pnpm audit --prod --audit-level high` reported no known vulnerabilities. |
| Security headers and CSP | **Passed** | CORS denial, CSP nonce, anti-framing, HSTS, `nosniff`, and absence of `unsafe-eval` and style `unsafe-inline` assertions passed. |
| Redirect, SSRF, storage-key, and path checks | **Passed** | The repository test rejected external/encoded redirects, private addresses, unsafe storage keys, and path traversal candidates. |
| Live unauthenticated smoke scanner | **Passed** | The scanner observed protected redirects, no exposed sensitive files, and no basic reflected XSS on tested public routes. |
| Database-backed security-scope tests | **Not run to completion** | They require an isolated `DATABASE_URL`; none was configured in this sandbox. This is an evidence limitation, not a failed security assertion. |
| Database-backed authorization-policy tests | **Not run to completion** | They require an isolated test database and credentials. They must be rerun before release sign-off. |

The dependency installation created only the untracked TypeScript cache file `tsconfig.tsbuildinfo`; it did not modify tracked project source.

## Findings

### SEC-01 — Safety check-in links expose precise location to anyone holding the bearer URL

**Severity:** Medium privacy risk  
**Status:** Open; partially intentional product behavior

The public route `src/app/api/safety-checkin/[token]/route.ts` accepts a long token in the URL and returns the user’s first name, exact latitude and longitude, label, expiry, and safety status. The token is the authorization mechanism. There is no additional authentication, link revocation endpoint visible in the reviewed route, request throttling, or access logging at the public endpoint.

This is a reasonable design for sharing a safety link, but URLs can leak through browser history, screenshots, chat previews, referrer metadata, copied messages, and third-party logging. A leaked active URL therefore discloses sensitive location information until expiry. The database also stores the active token directly in the `SafetyCheckIn` record, so a database read exposure would immediately expose active links.

**Recommended remediation:** store only a hash of the share token and compare a hash of the presented token; add explicit revoke/delete support; return the minimum necessary data; consider a coarse location or a deliberate user-selected precision mode; add low-cost per-token and per-IP throttling; and set a restrictive `Referrer-Policy` for the public check-in page and API response. The product copy should clearly state that possession of the link grants access to the shared location.

### SEC-02 — Cloudinary security remains dependent on provider-side preset restrictions

**Severity:** Medium operational and abuse risk  
**Status:** Open; repository-side controls are good

The Cloudinary upload route performs same-origin enforcement, agent-role and verification checks, request and file-size limits, MIME allowlisting, magic-byte signature checks, upload-batch limits, rate limiting, fixed Cloudinary host validation, and HTTPS URL validation. These are strong application controls.

The route uses a client-visible unsigned upload preset through `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`. If the Cloudinary preset is broader than intended, an attacker may bypass application assumptions by calling Cloudinary directly or may cause storage and transformation abuse. The repository cannot verify the preset’s resource type, folder restriction, overwrite policy, transformation limits, or quota behavior.

**Recommended remediation:** record provider evidence that the preset is image-only, restricted to the intended folder, non-overwriting, size-limited, transformation-limited, and monitored. Prefer signed, short-lived server-issued upload parameters where feasible. Add a periodic provider configuration check to the launch runbook.

### SEC-03 — Historical credential rotation and deployment-secret provenance remain unverified

**Severity:** High if a historical credential was exposed; otherwise Medium assurance gap  
**Status:** Open pending provider evidence

The supplied update explicitly records historical Resend and NextAuth credential rotation as pending or unverified. The repository correctly excludes real environment files and no live secret was found in tracked source during this review. However, source hygiene does not establish that credentials appearing in historical logs, provider variables, screenshots, local machines, or previous deployment configurations were revoked.

A stale authentication secret, email credential, payment key, or cron secret can invalidate otherwise strong application controls. The current source has sensible secret handling, but the audit cannot prove the operational state of the secrets.

**Recommended remediation:** inventory every historical credential referenced by Git history, deployment logs, local configuration, and provider settings; revoke and replace credentials that may have been exposed; rotate `NEXTAUTH_SECRET` only with a planned session invalidation window; rotate `CRON_SECRET`, email credentials, Paystack keys, Cloudinary secrets, Pusher credentials, and database credentials as appropriate; and record key IDs, rotation dates, owner, and environment without recording values.

### SEC-04 — Database-backed authorization evidence is not reproducible in the current checkout environment

**Severity:** Medium release-assurance gap  
**Status:** Open validation item

The repository contains authorization isolation and policy tests, but `pnpm test:security-scope` and `pnpm test:authz:policy` could not complete because no isolated `DATABASE_URL` was configured. The supplied project update reports earlier passing results, but those results are historical and were produced against different environments and commits.

This does not indicate that authorization is broken. The source review found repeated role and ownership checks, including protected layouts, server actions, private messages, agent ownership, admin boundaries, and verification-document access. It does mean that the current commit lacks fresh database-backed evidence for cross-account isolation, status transitions, notification ownership, booking ownership, and admin denial behavior.

**Recommended remediation:** create a disposable staging database with synthetic Corp Member, Agent, and Admin accounts; run the complete authorization, business-flow, password-change, simulated-payment, saved-search, and security-scope suites; retain the commit SHA, schema version, environment identifier, and test output; and ensure cleanup is automatic and isolated from production.

## Additional hardening observations

The following observations are not confirmed vulnerabilities but are worthwhile improvements:

| Area | Observation | Suggested action |
|---|---|---|
| Simulated premium checkout | `simulateAnnualPremiumForUser` is an internal helper without its own authentication check, while the exposed server action calls `requireUser` first. | Keep the helper unexported or add an explicit authenticated-caller contract so future callers cannot accidentally bypass the action boundary. |
| Outbound fetch | `safeOutboundFetch` performs DNS resolution checks before fetching. The allowlists substantially reduce exposure, but hostname resolution is inherently subject to a time-of-check/time-of-use race. | Prefer fixed provider endpoints or an HTTP client that pins the validated address where arbitrary host support is ever introduced. |
| Safety-link enumeration | Invalid tokens receive a generic response, which is good, but active-token lookups are not visibly rate limited. | Add per-IP and per-token throttling and monitor unusual access patterns. |
| Cron routes | Cron endpoints use a bearer `CRON_SECRET` and return no-store responses. | Keep the secret long, random, environment-specific, rotated, and excluded from logs; alert on repeated unauthorized requests. |
| Payment activation | Paystack verification checks reference, status, amount, currency, customer email, provider, role, and idempotent payment state. | Retain reconciliation evidence and alert on repeated verification mismatches or provider/API failures. |
| Uploads | Signature checks validate file headers but do not constitute full image decoding or malware scanning. | Consider image re-encoding and provider-side malware/quota monitoring for higher assurance. |

## Controls that passed review

The current branch contains the following effective controls:

- Role-aware middleware and server-layout protection for Corp Member, Agent, and Admin workspaces.
- Banned-user and session-version checks in the NextAuth JWT/session flow.
- Secure production session-cookie configuration with host-only cookies and `SameSite=Lax`.
- Login rate limiting, bounded failure delay, account lockout, and role-selection mismatch checks.
- Email verification and single-use Google onboarding state handling.
- Same-origin and CORS denial for untrusted API origins.
- Safe callback URL allowlisting and rejection of encoded, protocol-relative, and external redirects.
- SSRF protection against loopback, private, link-local, metadata, and local hostnames.
- File-path confinement and verification-document authorization through the admin route.
- MIME, signature, size, count, and rate controls for uploads.
- Server-side Paystack verification with HMAC webhook validation and idempotent activation.
- CSP nonce support, HSTS, anti-framing, `nosniff`, restrictive referrer policy, and no `unsafe-eval` in the tested policy.
- Dependency audit with no high-severity production advisories reported.
- Audit logging around sensitive business and security mutations.

## Prioritized remediation plan

### Before production security sign-off

1. Complete credential inventory and rotation evidence, especially historical email, NextAuth, Paystack, database, upload, realtime, and cron credentials.
2. Verify and document Cloudinary preset restrictions and quota protections.
3. Run the database-backed authorization and business-flow suites against an isolated staging database at commit `8ce1e50`.
4. Decide and document the privacy model for safety links, then implement token hashing, revocation, throttling, and minimum-data responses if the feature remains public.
5. Verify Vercel Firewall/Bot Management, monitoring, backups, rollback, and alert routing in provider consoles.

### Before the next security review

1. Add automated tests for safety-token leakage, revocation, throttling, and response minimization.
2. Add an operational test for notification cron replay and unauthorized-request alerting.
3. Add provider configuration evidence to the launch checklist rather than treating source configuration as proof.
4. Reconcile the project update document with the current commit and current route state.

## Final assessment

The application has made substantial security progress since the earlier project update. The current source demonstrates layered controls rather than relying on client-side visibility or a single middleware check. The most important next step is not a broad rewrite; it is to close the operational evidence gaps and validate the current commit with a disposable database-backed test environment.

**Assessment:** strong application-level baseline; no confirmed critical or high source-code finding; medium-priority privacy, provider-assurance, credential-rotation, and reproducibility items remain open.

## References

[1]: https://github.com/akeemadetunji1234-wq/NYSC "Neat & Affordable / NYSC repository"
[2]: https://owasp.org/www-project-application-security-verification-standard/ "OWASP Application Security Verification Standard"
[3]: https://owasp.org/www-community/attacks/Server_Side_Request_Forgery "OWASP Server-Side Request Forgery guidance"
[4]: https://docs.paystack.co/payments/webhooks "Paystack webhook documentation"
[5]: https://cloudinary.com/documentation/upload_presets "Cloudinary upload preset documentation"
[6]: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy "Next.js Content Security Policy guidance"

## Local evidence reviewed

- `README.md`
- `PROJECT_LOG.md`
- `middleware.ts`
- `prisma/schema.prisma`
- `src/lib/authGuard.ts`
- `src/lib/authorization.ts`
- `src/lib/authSecurity.ts`
- `src/lib/safeRedirect.ts`
- `src/lib/safeOutboundFetch.ts`
- `src/lib/safeFileStorage.ts`
- `src/lib/paystack.ts`
- `src/lib/premiumCheckout.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/upload/route.ts`
- `src/app/api/upload/cloudinary/route.ts`
- `src/app/api/admin/verification-document/route.ts`
- `src/app/api/safety-checkin/[token]/route.ts`
- `src/app/api/payments/paystack/webhook/route.ts`
- `src/app/api/payments/paystack/callback/route.ts`
- `src/app/api/cron/*/route.ts`
- `scripts/security-scan.py`
- `scripts/test-security-file-redirect-ssrf.mjs`
- `scripts/test-security-headers.ts`
- `scripts/test-security-scope.mts`
- `scripts/test-authorization-policy.mjs`
- `/home/ubuntu/upload/pasted_content.txt`

> This report is a source and validation review. It is not a penetration test, provider-console attestation, malware assessment, or legal compliance certification.
