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
