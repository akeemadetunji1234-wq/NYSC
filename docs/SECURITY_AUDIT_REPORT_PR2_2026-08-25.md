# NYSC Security Audit Report: PR #2 Merge and Post-Deployment Verification

**Date:** 25 August 2026  
**Application:** Neat & Affordable / NYSC  
**Production deployment:** [nysc-mu.vercel.app](https://nysc-mu.vercel.app)  
**Author:** Manus AI

## Executive summary

Security pull request #2, **“Security: harden authentication and edge request controls,”** was reviewed and merged into `main` on 25 August 2026. The merge commit is [`6f53157`](https://github.com/akeemadetunji1234-wq/NYSC/commit/6f5315786e0bbcbe7f29734089abb8b1ebd2ae97), and the associated Vercel production deployment is [`dpl_6JFiHRiNDXkSEmkikgc65HwM8MFy`](https://vercel.com/akeemadetunji1234-wqs-projects/nysc/6JFiHRiNDXkSEmkikgc65HwM8MFy). The deployment reached **READY** and is aliased to the production domain.

The deployed verification checks confirmed that protected role routes redirect unauthenticated users, sensitive-file probes are not exposed, cross-origin state-changing requests are rejected, oversized registration payloads are rejected, and the basic XSS reflection checks found no reflection. The updated security checklist passes with exit code 0, and the production API smoke suite completed with **11 passed and 0 failed**.

The full write-capable authentication lifecycle test could not run because the sandbox does not have a `DATABASE_URL`. This is an intentional safety gate in the test itself: it refuses to mutate a production database without an explicitly supplied database connection. The static curated-essentials test also failed because its Lagos sample produced zero parsed records and therefore did not demonstrate the required category coverage. These are test-coverage or data-quality follow-ups, not evidence that the merged authentication controls failed.

## 1. Audit scope and evidence

This audit covered the source changes in PR #2, the merged GitHub state, the production deployment state, the deployed authentication and edge-control behavior, the security checklist, the available integration and smoke tests, and the two obsolete API paths previously reported by the scanner.

| Evidence | Result |
|---|---|
| [PR #2](https://github.com/akeemadetunji1234-wq/NYSC/pull/2) | Merged into `main` |
| Merge commit [`6f53157`](https://github.com/akeemadetunji1234-wq/NYSC/commit/6f5315786e0bbcbe7f29734089abb8b1ebd2ae97) | Present on `main` and production deployment metadata |
| [Vercel deployment](https://vercel.com/akeemadetunji1234-wqs-projects/nysc/6JFiHRiNDXkSEmkikgc65HwM8MFy) | Production target, `READY` |
| [`scripts/security-scan.py`](https://github.com/akeemadetunji1234-wq/NYSC/blob/main/scripts/security-scan.py) | Obsolete API probes removed; scan passes |
| [`scripts/post-cleanup-api-smoke.sh`](https://github.com/akeemadetunji1234-wq/NYSC/blob/main/scripts/post-cleanup-api-smoke.sh) | 11/11 checks passed against production |
| [`scripts/role-integration-smoke.sh`](https://github.com/akeemadetunji1234-wq/NYSC/blob/main/scripts/role-integration-smoke.sh) | All listed role routes redirected with HTTP 307; API boundary responses were appropriate |
| [`scripts/test-registration-login.mjs`](https://github.com/akeemadetunji1234-wq/NYSC/blob/main/scripts/test-registration-login.mjs) | Blocked before execution because `DATABASE_URL` was unavailable |

## 2. PR #2 review

PR #2 adds layered controls at both the application and request-edge levels. The middleware now applies request-size checks, same-origin enforcement for state-changing API requests, distributed or fallback rate limiting for authentication routes, and fail-closed role-route protection. The authentication route adds account lockout after repeated failed credentials, session-version invalidation, secure production cookies, and security-event logging. Registration, OTP, password reset, upload, and administrator password flows receive additional validation, generic responses, rate limits, input normalization, or session revocation.

The PR also adds the `0004_auth_security_hardening` Prisma migration, a compatibility route at `/admin/safety` that redirects to the implemented reports page, and operational documentation for provider-side firewall, bot-management, database privilege, and verification requirements. The Vercel frozen-lockfile problem discovered during review was repaired in commit [`b2b95e8`](https://github.com/akeemadetunji1234-wq/NYSC/commit/b2b95e8) before the PR was merged.

| Control area | Implemented change | Review conclusion |
|---|---|---|
| Edge request controls | Payload-size limits, same-origin checks, authentication-route rate limits | Present and verified in production probes |
| Protected document routes | `/admin`, `/agent`, and `/member` fail closed without a valid session | Present and verified with HTTP 307 redirects |
| Credentials | Invalid input rejection, failed-login tracking, temporary account lockout | Present in the merged authentication handler |
| Session invalidation | Session version increments on password change/reset and invalidates stale JWT sessions | Present in the merged authentication handler |
| Registration and OTP | Generic responses, OTP attempt controls, rate limits, normalized input | Present in merged routes/actions |
| Uploads | Same-origin enforcement, request/file-size checks, MIME/signature validation, private Blob storage path | Present in merged upload route |
| Security audit events | Authentication and password-reset events recorded through security-event helper | Present in merged actions and auth route |
| Route consistency | `/admin/safety` compatibility route added | Present; redirects to `/admin/reports` |
| Dependency installation | pnpm 10-compatible lockfile normalization | Verified by frozen install and successful deployment |

## 3. Production deployment verification

The final deployment record reports `readyState: READY`, target `production`, and the merged commit SHA `6f5315786e0bbcbe7f29734089abb8b1ebd2ae97`. The deployment aliases include `nysc-mu.vercel.app`, confirming that the merged code reached the production alias.

The production security checklist returned exit code 0. It confirmed that `.env`, `.git/config`, `package.json`, `prisma/schema.prisma`, and `.vercel/project.json` were not publicly accessible; `/admin`, `/agent/dashboard`, and `/member/dashboard` returned HTTP 307 without authentication; and the basic reflected-XSS checks returned no tested payload reflection.

Focused non-mutating probes produced the following results.

| Production probe | Expected result | Observed result | Assessment |
|---|---:|---:|---|
| Cross-origin `POST /api/auth/register` | 403 | **403** | Same-origin control active |
| Cross-origin `POST /api/upload` | 403 | **403** | Same-origin control active |
| Oversized registration request | 413 | **413** | Request-size control active |
| Unauthenticated `GET /admin/analytics` | 307 | **307** | Protected page redirects to sign-in |
| Unauthenticated `GET /member/transport` | 307 | **307** | Protected page redirects to sign-in |

## 4. Integration and smoke-test results

The available production-safe integration suite was run against `https://nysc-mu.vercel.app`. The role and API-boundary smoke test covered the Member, Agent, and Admin route groups. Every listed protected role route returned HTTP 307. The public health endpoint returned HTTP 200, while protected API boundaries returned HTTP 401 or the method-appropriate response.

The post-cleanup API smoke suite completed with **11 passed and 0 failed**. It verified health, NextAuth providers, CSRF issuance, session behavior, invalid registration validation, verification-document authorization, Pusher authorization, malformed upload handling, keep-alive authorization, and OTP-cleanup authorization.

| Suite | Result | Notes |
|---|---|---|
| Role integration smoke | Passed for listed boundary checks | All role routes returned 307; `/api/health` returned 200; protected APIs returned 401; `/api/upload` returned 405 for unauthenticated GET, which is method-correct |
| Post-cleanup API smoke | **11 passed, 0 failed** | Production-safe boundary and validation checks |
| Updated security checklist | Exit code 0 | Obsolete API probes no longer included |
| Dependency audit | Previously passed with no known vulnerabilities | No dependency vulnerability was reported during the merged-PR verification |
| Registration/login E2E | Not run | Test requires `DATABASE_URL` and refuses production writes without it |
| Curated essentials data test | Failed | Lagos sample parsed zero records and lacked the required categories; this requires a data/parser follow-up |

The registration/login E2E test was deliberately not forced past its safety gate. It creates and deletes database records and requires a database connection, so running it against production would require a dedicated, explicitly authorized test database or a carefully controlled production test account and cleanup plan. The current test design correctly prevents accidental production mutation.

## 5. Investigation of the reported 404 API responses

The scanner previously probed `/api/admin/analytics` and `/api/premium/guides`. Both paths return HTTP 404 in production because neither API route exists in the application. The 404 behavior is safe and does not indicate an exposed unauthenticated endpoint.

`/api/admin/analytics` is not the implemented data path. The application has a protected page at `/admin/analytics`, and that page calls the server actions `getAdminAnalytics` and `getRegionalHeatmapData` from the admin actions module. There is no `src/app/api/admin/analytics/route.ts` file and no source reference to the obsolete API path.

Likewise, `/api/premium/guides` is not the implemented data path. The protected `/member/transport` page calls `getTransportGuides` from `src/app/actions/premium.ts`, which reads published `TRANSPORT` content items through Prisma. There is no `src/app/api/premium/guides/route.ts` file and no source reference to the obsolete API path.

The security checklist was updated in commit [`be2afb7`](https://github.com/akeemadetunji1234-wq/NYSC/commit/be2afb7) to remove both obsolete probes while retaining the valid protected-page checks. The updated checklist was rerun successfully.

## 6. Residual risks and recommended follow-up

The main residual test gap is the authenticated registration/login lifecycle. It should be run against an isolated staging database with a disposable test account, valid OTP setup, and explicit test credentials. It should not be forced against production merely to obtain a green result.

The curated-essentials test should be repaired or updated before it is treated as a release gate. Its current run reported zero parsed Lagos records and missing supermarkets, restaurants, and pharmacies. The source dataset, parser assumptions, and geographic sample radius should be reviewed together.

The scan checklist now reflects the current route architecture, but its name and output should continue to distinguish protected pages from API endpoints. If an external consumer later requires analytics or transport-guide APIs, those endpoints should be added as deliberate, authenticated interfaces with separate contract tests rather than reintroducing stale probes.

Provider-side controls documented in [`docs/SECURITY_EDGE_CONTROLS.md`](https://github.com/akeemadetunji1234-wq/NYSC/blob/main/docs/SECURITY_EDGE_CONTROLS.md) still require operational confirmation in Vercel: firewall and bot-management rules, database role separation, monitoring, and review of block/challenge rates. The application-level controls verified here do not replace those provider and database controls.

## Conclusion

PR #2 was successfully reviewed, merged, deployed, and verified. The production deployment is **READY**, the key unauthenticated boundary and edge-control probes behave as intended, and the available production-safe API smoke suite passed completely. The two reported API 404s were confirmed to be obsolete scanner targets rather than missing security controls. The remaining work is limited to running the write-capable auth lifecycle test in an isolated environment, repairing the curated-essentials test/data coverage, and completing the provider-side operational checklist.

## References

[1]: https://github.com/akeemadetunji1234-wq/NYSC/pull/2 "NYSC PR #2 — Security: harden authentication and edge request controls"
[2]: https://github.com/akeemadetunji1234-wq/NYSC/commit/6f5315786e0bbcbe7f29734089abb8b1ebd2ae97 "NYSC merge commit for PR #2"
[3]: https://vercel.com/akeemadetunji1234-wqs-projects/nysc/6JFiHRiNDXkSEmkikgc65HwM8MFy "NYSC Vercel production deployment"
[4]: https://github.com/akeemadetunji1234-wq/NYSC/blob/main/scripts/security-scan.py "NYSC security scan checklist"
[5]: https://github.com/akeemadetunji1234-wq/NYSC/blob/main/scripts/post-cleanup-api-smoke.sh "NYSC post-cleanup API smoke suite"
[6]: https://github.com/akeemadetunji1234-wq/NYSC/blob/main/scripts/role-integration-smoke.sh "NYSC role integration smoke suite"
[7]: https://github.com/akeemadetunji1234-wq/NYSC/blob/main/scripts/test-registration-login.mjs "NYSC authentication lifecycle test"
[8]: https://github.com/akeemadetunji1234-wq/NYSC/blob/main/docs/SECURITY_EDGE_CONTROLS.md "NYSC security edge controls documentation"
[9]: https://github.com/akeemadetunji1234-wq/NYSC/commit/be2afb7 "NYSC commit removing obsolete API security probes"
[10]: https://github.com/akeemadetunji1234-wq/NYSC/commit/b2b95e8 "NYSC lockfile normalization commit"
