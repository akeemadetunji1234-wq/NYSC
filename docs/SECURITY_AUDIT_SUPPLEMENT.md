# Security Audit Supplement

This supplement applies the additional security review requirements supplied in `pasted_content.txt` to the NYSC repository audit.

## Evidence-to-repository assessment

| Requirement | Audit result | Disposition |
|---|---|---|
| Parameterized SQL and injection tests | No unsafe Prisma raw-query APIs or string-built SQL were found. The only raw SQL calls are static `SELECT 1` health checks. Prisma queries use structured `where` objects and explicit fields. | No immediate SQL injection finding. Retain a rule forbidding raw request objects or dynamic SQL fragments in ORM calls. |
| NoSQL/operator injection | No MongoDB, Mongoose, Supabase, or client-accessible NoSQL/RPC query surface was found. | Not applicable to the current stack; reassess if a NoSQL or RPC provider is added. |
| Shell execution | The only process execution is in `scripts/migrate-production.mjs`, using `execFileSync` with fixed executable names and fixed argument arrays. No shell interpolation or user-controlled command arguments were found. | Acceptable with least-privilege deployment execution. Keep hostile-metacharacter tests if command arguments become configurable. |
| Server-side template evaluation | No `eval`, `new Function`, template compilation, or VM evaluation was found. | No immediate template-injection finding. Continue passing user values as data to fixed templates. |
| Stored XSS and unsafe HTML | React rendering is used for application content. Map labels and popup content now use DOM construction, `textContent`, `setDOMContent`, URL allowlisting, and encoded listing links. The chart style is emitted as a React text child rather than `dangerouslySetInnerHTML`. | **Fixed in the current branch.** Retain stored-XSS regression payloads for comments, profiles, messages, filenames, and admin-visible fields. |
| Reflected URL/form input | URL parameters are used for validated IDs, search coordinates, reset tokens, or router navigation. Next.js/React escaping is used for display. The sign-in callback URL is constrained to a relative path. | No confirmed reflected-XSS finding. Add regression payloads such as `<img src=x onerror=alert(1)>` to the relevant page tests. |
| Client-side DOM sinks and `postMessage` | No `document.write`, `outerHTML`, or `postMessage` consumer was found. Map labels/popups now use `textContent`, `setDOMContent`, `replaceChildren`, and safe URL handling. | **Fixed in the current branch.** No cross-window origin issue was found. |
| CSRF and state-changing methods | NextAuth issues a CSRF token; middleware and sensitive API routes validate same-origin state-changing requests. Cron handlers now support authenticated POST for manual execution, reject ordinary authenticated GET with 405, and accept GET only when both the cron bearer secret and Vercel’s `vercel-cron/1.0` user agent are present. | **Fixed at the application boundary.** Vercel Cron itself invokes scheduled paths with GET, so the provider protocol remains a constrained exception; keep the bearer secret and user-agent check and do not expose the route as a general GET API. |
| Content Security Policy | CSP, HSTS, clickjacking, MIME, referrer, and permissions headers are configured. The current middleware generates a per-request script nonce and uses `strict-dynamic`; development-only `unsafe-eval` was removed. Inline styles remain allowed for Mapbox and existing component style attributes. | **Script policy hardened.** A future style-system migration can remove the remaining style inline allowance without breaking Mapbox/UI rendering. |

## Exact Vercel WAF rules to configure

The linked project is `nysc` under the Hobby team. The connected Vercel integration exposes deployment-protection reads but no WAF-rule mutation operation, so the following rules must be entered through the Vercel Firewall/Bot Management interface or an authorized security API.

| Priority | Match condition | Action | Purpose |
|---:|---|---|---|
| 1 | All requests with obvious SQLi, XSS, RCE, LFI/RFI, path-traversal, or anomaly signatures | Deny using the managed OWASP/Vercel rulesets | Block reconnaissance and common exploit payloads before the app. |
| 2 | `POST /api/auth/*`, aggregate by source IP, more than 60 requests in 15 minutes | Managed challenge, escalating to deny for continued abuse | Stop credential spraying and OTP/reset automation. |
| 3 | `POST /api/auth/callback/credentials`, `POST /api/auth/register`, and password-reset paths, more than 20 requests per source IP in 15 minutes | Managed challenge or deny | Apply a stricter authentication threshold. |
| 4 | `POST /api/upload`, more than 20 requests per authenticated source/IP in 15 minutes, or more than 5 for pre-registration traffic | Managed challenge or deny | Protect document storage and image processing from abuse. |
| 5 | `/api/auth/*`, `/api/upload`, `/api/nearby-essentials`, `/member/marketplace`, and other high-value listing routes with automated bot classification | Managed challenge; deny confirmed malicious automation | Reduce scraping and reconnaissance while preserving normal browsers. |
| 6 | `/api/admin/*`, `/api/pusher/auth`, and private document paths from anomalous automation or untrusted geographies | Challenge, with explicit trusted exceptions only where justified | Protect privileged and private-data surfaces. |
| 7 | Requests with missing/invalid host or suspicious proxy headers on sensitive routes | Deny | Reduce host-confusion and proxy-abuse paths. |
| 8 | Rate-limit key for application-level authenticated operations | Use the authenticated user or organization key where the Vercel rate-limit SDK is available; otherwise retain the application’s Upstash limiter | Prevent a shared NAT from unfairly consuming every user’s quota. |

After deployment, verify that the firewall logs show the expected challenge/deny decisions for the auth, upload, nearby-search, marketplace, and admin paths. Exclude only documented monitoring/deployment IPs; do not add broad bypass rules for internal paths.

## Secret audit conclusion

The current tracked-source scan and client static-asset scan found no live credential-like values. The tracked `.env.example` now contains empty secret/database fields and explanatory comments. The ignored local `.env.test.local` contains disposable test credentials only.

Git history still contains a previously committed `.env.local` with values under `RESEND_API_KEY` and `NEXTAUTH_SECRET`. Those values are not reproduced here. Treat them as compromised and rotate them in Resend and Vercel. The repository history was not rewritten because force-pushing history would be destructive and the required replacement credentials were not supplied.

## Authorization branch diff summary

The exact committed comparison from `security/auth-edge-hardening` to `security/authorization-isolation-audit` is:

```text
 .env.example                             |  14 ++--
 docs/AUTHORIZATION_INVENTORY.md          |  41 +++++++++++
 package.json                             |   2 +
 scripts/role-integration-smoke.sh        |   2 +-
 scripts/test-authorization-isolation.mjs | 120 +++++++++++++++++++++++++++++++
 scripts/test-authorization-policy.mjs    |  32 +++++++++
 scripts/test-registration-login.mjs      |   3 +-
 src/app/actions/member.ts                |   3 +
 src/app/actions/premium.ts               |  19 -----
 src/app/actions/property.ts              |   6 +-
 src/app/api/pusher/auth/route.ts         |   7 +-
 src/lib/authGuard.ts                     |  18 ++---
 src/lib/authorization.ts                 |  20 ++++++
 src/lib/savedSearchNotifications.ts      |  30 ++++++++
 14 files changed, 270 insertions(+), 47 deletions(-)
```

The current attachment-driven audit did not alter the committed authorization branch; this supplement records the assessment and the remaining concrete remediation work.
