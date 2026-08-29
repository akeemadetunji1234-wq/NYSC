# Upload, Booking, and Authentication Security Audit

**Date:** 27 August 2026
**Scope:** Cloudinary listing-image uploads, booking slot integrity, browser sessions, NextAuth JWT handling, Google OAuth redirects, authentication abuse controls, and password reset.

## Completed application controls

| Surface | Control | Evidence |
|---|---|---|
| Cloudinary listing images | Uploads now pass through `/api/upload/cloudinary`; only authenticated, database-confirmed active Agents can upload. JPG, PNG, and WebP signatures are checked server-side, with a 10MB file limit. | `src/app/api/upload/cloudinary/route.ts`, `src/lib/agentPosting.ts` |
| Cloudinary abuse | Limits are applied per Agent, per source IP, and per five-file batch using the existing Upstash-or-bounded-fallback limiter. The browser helper no longer posts directly to Cloudinary. | `src/lib/cloudinaryAbuse.ts`, `src/lib/cloudinaryUpload.ts` |
| Booking creation | Requests for the same property/date/time acquire a PostgreSQL transaction advisory lock before checking active conflicts. Only one concurrent transaction can create the active slot. | `src/lib/bookingConcurrency.ts`, `src/app/actions/booking.ts` |
| Booking rescheduling | Destination slots use the same lock and active-conflict query. A reschedule cannot claim a slot already held by another active booking. | `src/app/actions/booking.ts` |
| Session lifetime | JWT and session maximum age are explicitly set to seven days. Password changes and resets increment `sessionVersion`; the existing session-revocation helper deletes stored sessions. | `src/app/api/auth/[...nextauth]/route.ts`, `src/lib/passwordChange.ts` |
| Session revocation | Session callback fails closed for invalidated, banned, missing-identity, or missing-role tokens. JWT callback refreshes role and account state from the database. | `src/lib/authSecurity.ts`, `src/app/api/auth/[...nextauth]/route.ts` |
| Cookie transport | NextAuth’s secure-cookie mode is enabled in production, with its default HttpOnly and SameSite cookie policy. Middleware now selects the same secure cookie name as NextAuth in production/HTTPS contexts. | `middleware.ts`, `src/app/api/auth/[...nextauth]/route.ts` |
| OAuth redirect | Redirect callbacks accept only same-origin URLs under the application’s root, member, agent, or admin route prefixes. External hosts and protocol-relative URLs fall back to the configured base URL. | `src/lib/authSecurity.ts` |
| OAuth state and PKCE | Google is explicitly configured with `checks: ["pkce", "state"]`; NextAuth performs the state binding and S256 PKCE verification. | `src/app/api/auth/[...nextauth]/route.ts` |
| Credential authentication | Login has per-email and per-source-IP rate limits, generic rejection behavior, temporary lockout after repeated invalid passwords, and a fixed dummy bcrypt hash for unknown accounts to reduce timing-based enumeration. | `src/app/api/auth/[...nextauth]/route.ts`, `middleware.ts` |
| Password reset | Reset tokens use `crypto.randomBytes(32)`, are stored as SHA-256 hashes, expire after one hour, are single-use, and increment `sessionVersion` after reset. Request responses are generic for existing and non-existing accounts. | `src/app/actions/auth.ts` |

## Regression coverage

The isolated `pnpm test:security-boundaries` suite passes these checks: authenticated NextAuth JWT decode, tampered-token rejection, expired-token rejection, same-origin redirect allowlisting, invalidated/banned/incomplete session rejection, Cloudinary five-file batch limit, per-Agent upload limit, shared-IP upload limit, and concurrent booking-slot serialization.

The existing isolated suites also pass for authorization policy, password change and stored-session revocation, authentication registration/login, authorization isolation, and marketplace/booking business flows. Tests use the isolated database and synthetic accounts only; no real email, payment, production write, or external media upload is used.

## Residual and owner-only controls

The Cloudinary preset remains an unsigned client-facing provider configuration. The server proxy substantially reduces application abuse, but the preset itself should still be constrained in Cloudinary to image-only uploads, a dedicated folder, file-size/transformation limits, and no unnecessary overwrite capability. A future signed-upload flow should be considered before high-volume public launch.

Vercel Firewall/Bot Management remains a provider-side configuration task. Configure the documented managed exploit rules, authentication/upload rate controls, bot challenges, and admin/private-route protection, then verify challenge/deny events in provider logs.

Any credential found in Git history must be revoked and replaced at the provider. Source cleanup and a successful build do not prove invalidation. No secret values are included in this document.

The application does not currently collect or hold property rent or deposits. Paystack premium activation remains disabled until provider approval, server-side reference verification, signed webhooks, idempotency, reconciliation, and refund/support policies are tested.

## Focused verification, persistence, CORS, CSP, redirect, and SSRF hardening

| Surface | Implemented control | Evidence |
|---|---|---|
| Email verification | Signup keeps the six-digit OTP UX, but each issuance also creates a 32-byte cryptographically random link token; only its SHA-256 hash is stored in `EmailOtp`. The token is bound to the normalized email, expires after ten minutes, and is atomically consumed once. Successful registration sets `User.emailVerified` inside the transaction; no client field can set it. | `src/lib/emailVerification.ts`, `src/app/actions/otp.ts`, `src/app/api/auth/register/route.ts`, migration `0013_email_verification_token` |
| Google onboarding | Unknown Google sign-ins now receive an opaque, database-backed onboarding state bound to the callback email and stored display name. The state expires after ten minutes and is consumed atomically during registration. The previous `email` and `name` query parameters are no longer authoritative. | `src/app/api/auth/[...nextauth]/route.ts`, `src/app/verify-google/VerifyGoogleClient.tsx`, migration `0014_google_onboarding_state` |
| Persistent login | The unused Remember me control was removed rather than implying unsupported persistence. Browser sessions use the explicit seven-day NextAuth JWT/session lifetime; password changes/resets increment `sessionVersion` and revoke stored sessions. | `src/app/components/Auth/SignIn.tsx`, `src/lib/authSecurity.ts`, `src/lib/passwordChange.ts` |
| Authentication cookie | The session cookie is explicitly host-only, `Path=/`, `HttpOnly`, `SameSite=Lax`, and Secure in production/Vercel mode. Local HTTP tests deliberately use the non-Secure cookie name and do not make a false production assertion. | `src/lib/authCookiePolicy.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `scripts/test-security-scope.mts` |
| CORS | API requests are same-origin by default. No arbitrary Origin is reflected, no credentialed wildcard is emitted, and cross-origin access is denied unless a route is deliberately added to the empty public-route set and its origin is present in `CORS_ALLOWED_ORIGINS`. | `src/lib/security.ts`, `middleware.ts`, `scripts/test-security-scope.mts`, `scripts/test-security-headers.ts` |
| CSP and framing | The enforced CSP retains explicit `default-src`, nonce/strict-dynamic script policy, explicit style/image/connect/frame directives, `base-uri`, `object-src 'none'`, `frame-ancestors 'none'`, and no `unsafe-eval`. Middleware responses also carry X-Frame-Options DENY and HSTS. | `middleware.ts`, `next.config.mjs`, `scripts/test-security-headers.ts` |
| Redirects | Server-side callbacks remain same-origin and route-prefix allowlisted. Protocol-relative, external, encoded, and JavaScript redirect bypasses are rejected; client navigation is only a convenience and never the authorization boundary. | `src/lib/authSecurity.ts`, `scripts/test-security-scope.mts` |
| Server-side URL fetches | Fixed Brevo, Paystack, Cloudinary, and nearby-search provider destinations now use exact host allowlists, HTTPS-only validation, timeout controls, manual redirects, DNS resolution checks against private/link-local/loopback ranges, and bounded response reads. No generic user-controlled server URL fetcher was found in the inventory. | `src/lib/safeOutboundFetch.ts`, provider integrations, `scripts/test-security-scope.mts` |

The focused suites pass: `pnpm test:security-scope` and `pnpm test:security-headers`. The full local matrix also passed: `pnpm test:authz:policy`, `pnpm test:password-change`, `pnpm test:security-boundaries`, `pnpm test:business-flows`, `pnpm test:e2e:auth`, and `pnpm test:e2e:authz`, using `.env.test.local`, localhost, disposable fixtures, and cleanup. `pnpm audit --json`, TypeScript validation, and the production Next.js build passed. The build emitted only existing dependency deprecation warnings for `punycode`; no application build failure occurred.

The verification link itself is intentionally a short-lived one-time URL token, not a session token. The client removes it from the address bar after exchange, and session tokens remain in HttpOnly cookies. DNS checks occur before each outbound request and after each permitted redirect; an external network firewall remains a useful defense-in-depth control against future DNS rebinding or newly added integrations.

## Remaining owner/provider actions

The following items remain outside repository code: configure Vercel managed WAF/Bot Management rules and review firewall events; restrict the Cloudinary unsigned preset to image-only, dedicated-folder, size/transformation limits; rotate any credentials that may have appeared in historical Git or provider logs; and complete Paystack approval, webhook/idempotency/reconciliation/refund testing before enabling premium activation. No production writes, real customer accounts, real emails, payment transactions, or external media uploads were used for this validation.

## Vercel WAF status update

On 27 August 2026, the Vercel CLI authenticated to the linked project and published one live custom rule: **Auth endpoint IP protection**, matching paths beginning with `/api/auth/` and applying a source-IP fixed-window threshold of **60 requests per 900 seconds**, with **challenge** mitigation. A post-publication rules listing showed the rule enabled and the firewall diff reported no pending changes.

The Vercel Hobby plan rejected the attempted additional rate-limit rule with `Rate limiting is not available for this plan (401)`, and the overview command reported IP Bypass unavailable for the plan. Therefore, stricter provider-side rules for credential callbacks, registration, uploads, nearby search, and marketplace traffic remain unavailable on the current plan. The application-level middleware and route limits remain active for those surfaces. Bot Management-specific controls were not exposed by the authenticated CLI on this plan and remain a provider-plan/dashboard limitation.

Credential rotation is intentionally deferred at the owner’s request. No credential values were inspected, changed, or printed during this task.


## Authentication abuse hardening update — 29 August 2026

Credentials login now adds a bounded device signal derived from source IP and a truncated User-Agent value to the existing per-email and per-IP limits. Repeated invalid-password attempts receive progressive delay capped at 800 milliseconds; the existing temporary five-failure lockout remains time-limited and does not create a permanent attacker-triggerable lockout. Device signals are one-way hashes and are used only as rate-limit keys.

The full isolated validation matrix passed after this update: TypeScript, security boundaries, security scope, CSP/CORS/framing headers, authorization policy, password-change/session revocation, Paystack signature/activation/idempotency/mismatch tests, authentication E2E, authorization-isolation E2E, and business-flow E2E. `pnpm audit --json` reported zero informational, low, moderate, high, or critical advisories. The production build completed successfully; it emitted only the existing Node `punycode` deprecation warning from a dependency.

The OAuth implementation continues to use the maintained NextAuth provider with explicit `checks: ["pkce", "state"]`; NextAuth owns the state and S256 PKCE verification for the Google authorization exchange. Google onboarding uses a separate opaque, short-lived, database-backed one-time state after the trusted callback and never accepts client-supplied email or name as authority. Public login and reset responses remain generic.

The Paystack isolated test initially exposed an extensionless local import that was incompatible with the Node strip-types test runner; the import was corrected to `safeOutboundFetch.ts`. No production behavior or provider credentials changed.

Residual limitations remain provider/operations-owned: production WAF plan limitations, Cloudinary unsigned-preset restriction, credential rotation deferred at the owner’s request, and Paystack live approval plus webhook/reconciliation/refund readiness before enabling live premium activation.


## Production simulated penetration test — 29 August 2026

A safe read-only production probe tested CSP/framing headers, hostile-origin CORS, authentication endpoint rejection, secure cookie attributes, and the configured Vercel authentication-path WAF. Home, sign-in, verification, health, and provider-discovery requests returned HTTPS 200 responses with CSP, HSTS, X-Frame-Options DENY, `nosniff`, and Referrer-Policy headers. Hostile-origin GET and OPTIONS requests received HTTP 403 without reflected `Access-Control-Allow-Origin`; same-origin OPTIONS was also denied because no public cross-origin route is configured. Three malformed synthetic registration requests returned HTTP 400 without account creation.

A controlled 65-request probe against `/api/auth/providers` and a separate 65-request probe against `/api/auth/csrf` observed 65 HTTP 200 responses for each endpoint and no visible challenge status. The probe used no credentials, did not create sessions, and did not mutate application data. This is a WAF observability finding rather than proof that the published rule is absent; Vercel Firewall event analytics and active rule scope should be checked in the provider dashboard. Request volume should not be increased to force a challenge. The production penetration-test report is stored at `docs/PRODUCTION_AUTH_API_PENETRATION_TEST_2026-08-29.md`.

Cookie inspection confirmed production Secure, HttpOnly, SameSite=Lax, root-path cookies; cookie values were not retained. Existing isolated tests cover the deeper per-email, per-IP, device-signal, temporary-lockout, dummy-bcrypt, and bounded-delay logic without using production credentials.
