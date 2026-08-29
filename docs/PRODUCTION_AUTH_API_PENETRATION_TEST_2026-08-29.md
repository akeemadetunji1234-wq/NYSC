# Production Authentication and API Penetration-Test Report

**Date:** 29 August 2026
**Target:** `https://nysc-mu.vercel.app`
**Method:** Safe, low-volume, read-only simulated penetration test
**Authorization boundary:** Synthetic requests only; no login, signup success, email delivery, upload, payment, account mutation, or production data write was performed.

## Executive summary

The deployed application consistently enforced the expected browser-security headers and rejected hostile cross-origin API requests. Authentication registration probes with invalid synthetic input returned generic validation failures without creating accounts. The production CSRF endpoint returned secure cookie attributes. A 65-request low-volume probe against two public NextAuth endpoints returned HTTP 200 for every request and did not observe the configured Vercel challenge threshold; this is a provider-observability finding, not evidence that the rule is absent. Vercel Firewall event logs and the rule’s current activation state should be reviewed in the dashboard.

## Request matrix and observations

| Probe | Requests | Expected safe behavior | Observation | Result |
|---|---:|---|---|---|
| Home, sign-in, verification, health, and provider discovery | 1 each | HTTPS response with security headers | HTTP 200; CSP, HSTS, X-Frame-Options DENY, `nosniff`, and Referrer-Policy present | Pass |
| Hostile-origin `GET /api/health` | 1 | Reject untrusted origin and do not reflect it | HTTP 403; no `Access-Control-Allow-Origin` reflection | Pass |
| Hostile-origin `OPTIONS /api/health` | 1 | Reject untrusted preflight | HTTP 403 | Pass |
| Same-origin `OPTIONS /api/health` | 1 | No credentialed cross-origin CORS policy is required | HTTP 403 because no public cross-origin route is allowlisted | Expected policy behavior |
| Invalid synthetic registration payload | 3 | Reject malformed input without account creation or sensitive detail | HTTP 400 for all three requests | Pass |
| `GET /api/auth/providers` WAF probe | 65 | Threshold/challenge should be observable if the published rule applies to this path and source | 65 × HTTP 200; no challenge observed | Review required |
| `GET /api/auth/csrf` WAF probe | 65 | Threshold/challenge should be observable if the published rule applies to this path and source | 65 × HTTP 200; no challenge observed | Review required |
| `GET /api/auth/csrf` cookie inspection | 1 | Secure, HttpOnly, SameSite, host-only cookie policy | Cookie names and values were not retained; attributes showed Secure, HttpOnly, SameSite=Lax, and Path=/ | Pass |

## CSP and framing findings

The production responses included explicit `default-src`, `base-uri`, `object-src 'none'`, `frame-ancestors 'none'`, `form-action`, nonce-based `script-src` with `strict-dynamic`, explicit style/image/connect/frame directives, and `upgrade-insecure-requests`. No `unsafe-eval` directive was observed. Responses also included `X-Frame-Options: DENY`, `Strict-Transport-Security` with `includeSubDomains`, `X-Content-Type-Options: nosniff`, and a strict cross-origin referrer policy.

The CSP contains `style-src 'unsafe-inline'` for compatibility with the current frontend styling stack. This is weaker than a fully hash/nonce-based style policy, but it does not weaken the script policy and was not changed during this test. It should be reviewed in a future UI refactor if inline styling can be removed safely.

## CORS findings

The hostile-origin request received HTTP 403 and no reflected `Access-Control-Allow-Origin` header. The hostile preflight also received HTTP 403. The same-origin preflight received HTTP 403 because the application is same-origin by default and no route is currently configured for public cross-origin access. Browsers do not require a CORS preflight for ordinary same-origin requests, so this behavior does not block the intended browser flow.

No wildcard credentialed policy was observed. The current policy is appropriately deny-by-default; any future public cross-origin route should use an exact allowlist, explicit methods and headers, and `Vary: Origin`.

## Authentication abuse findings

Malformed registration requests returned HTTP 400 and did not expose whether an account exists. The test intentionally did not submit credential attempts to production because failed credential authentication can generate security telemetry and alter provider/application rate-limit state. Existing isolated tests cover per-email, per-IP, and device-signal rate limits, generic login failures, temporary lockout, dummy bcrypt comparison, and bounded progressive delay.

The live Vercel WAF probe sent 130 total GET requests across two authentication endpoints at approximately 12.5 requests per second. All returned HTTP 200. This did not cause a denial of service, but it means the published 60-per-900-second challenge rule was not externally observable in this probe. Possible explanations include rule scope/provider plan behavior, source-IP handling through the test environment, challenge behavior not represented by HTTP status, or delayed provider enforcement. The next safe action is to inspect Vercel Firewall events and rule analytics rather than increase request volume.

## Recommendations

Review the live Vercel Firewall rule and event logs, confirm that `/api/auth/*` is included in the active production ruleset, and ask Vercel support if challenge events are not visible. Do not repeat or increase production request volume to force a challenge. Keep the application-level controls active regardless of provider WAF behavior.

Retain the existing CSP and framing protections. Consider reducing `style-src 'unsafe-inline'` only as a dedicated frontend compatibility project. Preserve the empty-by-default public CORS route set. Continue using isolated test fixtures for login, password reset, email verification, Paystack, and webhook tests.

## Evidence and limitations

The audit was read-only at the production data layer. It did not attempt OAuth login, submit a password, create an account, send an email, upload an image, initialize a payment, invoke a webhook, or mutate a record. Cookie values, CSP nonces, response bodies, API keys, and other sensitive values were not retained in the report.
