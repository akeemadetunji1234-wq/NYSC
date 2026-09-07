# Complete Project History and Update Record — Neat & Affordable / NYSC

**Coverage:** Earliest available repository record through 6 September 2026  
**Project:** Neat & Affordable NYSC housing marketplace  
**Repository:** `akeemadetunji1234-wq/NYSC`  
**Current branch:** `main`  
**Current recorded HEAD:** `94bce2f`  
**Author:** Manus AI

## Purpose and evidence boundary

This document consolidates the progress, product updates, security audits, UI/UX changes, automation work, validation activity, deployment evidence, synchronization actions, and remaining issues recorded for the website.

The earliest verifiable history available in the restored repository begins on **18 June 2026**. This is therefore the earliest date covered by this record. It is not possible to reconstruct actions that are not present in the repository, Git history, project log, audit reports, or current-session tool records. Where reports disagree because they were produced at different times or against different environments, the disagreement is retained and explained rather than silently resolved.

This record distinguishes among four states:

| State | Meaning |
|---|---|
| **Implemented** | The repository contains the source or configuration evidence for the capability. |
| **Validated** | A documented test, audit, deployment, or read-only check recorded a successful result. |
| **Pending** | The work was identified but the required implementation or provider action is not recorded as complete. |
| **Unverified** | The repository suggests a configuration or behavior, but the required provider, browser, authenticated-session, or production evidence is unavailable. |

## Executive summary

Neat & Affordable developed from a booking prototype into a role-based Nigerian housing marketplace for National Youth Service Corps members seeking verified, affordable accommodation near their Place of Primary Assignment. The project now includes member, agent, and admin workspaces; listings; search and maps; booking requests; messaging; notifications; transport and nearby-essentials guidance; premium entitlements; external-payment references; media uploads; audit logs; security controls; deployment configuration; and repeatable validation scripts.

The repository contains **478 tracked files** at the current checkout. The project history records extensive application hardening, UI/UX refinement, deployment troubleshooting, authorization testing, mobile testing, payment-readiness work, and operations planning. The strongest documented local audit recorded **12 of 12 checks passing**. A later operational review recorded a separate responsive-smoke failure on `/signup`; that result is preserved as a follow-up item. The project should therefore be described as having strong application-level coverage with specific browser, provider, authenticated-mobile, and route-level work still open.

The website is documented as deployed at `https://nysc-mu.vercel.app`. The repository records multiple deployment commits and aliases over time, so deployment claims in older reports must be interpreted according to the report date and commit shown in that report.

## Timeline of progress

### 18–21 June 2026 — Foundation, framework, and build stabilization

The earliest available commits show the initial Neat & Affordable application being established and then adjusted for the Next.js and React runtime. The work included initial application cleanup, Turbopack configuration, removal of unsupported development flags, framework compatibility corrections, and upgrades or re-alignment involving Next.js, React, Firebase, and booking-card types.

The early build-stabilization work addressed Vercel compilation problems, unused imports, missing dependencies, and TypeScript type issues. These changes created a stable foundation for the subsequent marketplace, booking, map, and security work.

| Recorded milestone | Outcome |
|---|---|
| Initial Neat & Affordable application | Project foundation established |
| Turbopack and development configuration | Adjusted for supported framework behavior |
| Next.js and React compatibility | Corrected through framework/version changes |
| Firebase dependency and unused imports | Added or removed to resolve build failures |
| Booking-card and Vercel type errors | Corrected to restore deployability |

### 27 June–8 July 2026 — Marketplace, maps, search, reviews, QA, and booking identity

The next development phase introduced core marketplace behavior. The recorded work added map and PPA-distance features, search filters, a reviews system, and the CorperHome v5 feature set. The project also records a QA pass that resolved eleven reported bugs.

The booking application was then documented in the README and the build/deployment scripts were adjusted to handle database synchronization behavior. This period established the project’s identity as a booking marketplace rather than a static wireframe.

The principal product capabilities added or stabilized during this period were:

- Property discovery and marketplace presentation.
- Search and listing filters.
- PPA location and distance context.
- Reviews and property feedback.
- Booking-oriented listing and detail flows.
- Initial build and database synchronization behavior.
- QA fixes affecting the CorperHome experience.

### 13 August 2026 — Launch hardening, marketplace expansion, authentication, bookings, and scheduled jobs

A concentrated launch-hardening phase began on 13 August. The recorded commits include a marketplace expansion, OTP and authentication changes, server-side input handling, booking-workflow validation and throttling, a non-destructive production build correction, and Vercel Hobby cron-schedule fixes.

The booking workflow was hardened with validation, throttling, and safer server-side handling. Authentication work added or strengthened OTP-related behavior, input validation, and launch security. The build process was changed so production build activity would not perform unsafe destructive operations.

This phase also introduced or stabilized the operating model in which accommodation payments remain external arrangements between Corp Members and Agents. The application records booking and payment-confirmation information without presenting itself as a property-funds collector, escrow service, wallet, or payout processor.

### 16 August 2026 — Nearby essentials, agent contact, PPA mapping, and routing resilience

The project added Nearby Essentials to the marketplace and expanded it into a more realistic Nigerian search and fallback system. The recorded work removed fake generators, combined local search providers, broadened OSM tags, separated categories, increased the effective search radius to 30 km, reduced provider timeouts, and added curated Nigerian fallbacks for categories such as hospitals, banks, transport, and security.

Agent contact behavior was expanded to support both in-app messaging and WhatsApp contact options. The PPA profile picker was improved, and the commute map was upgraded with Mapbox directions and an OpenStreetMap/OSRM fallback path.

The commute-routing behavior now follows a cascading model:

1. Mapbox Directions is used as the primary street-routing provider.
2. OSRM/OpenStreetMap is used as a network fallback.
3. If both providers fail or time out, the property and PPA markers remain visible and the interface presents a non-intrusive directions-unavailable message.

The documented implementation also uses request timeouts to prevent a mapping provider from leaving a page or serverless request hanging indefinitely.

### 17 August 2026 — Dashboard journey audit, messaging fix, skeleton loading, themes, and staging release

The dashboard audit reviewed Corp Member, Agent, and Admin journeys using production and authenticated-session evidence available at the time. The audit found that role workspaces were substantially functional and that tested role boundaries did not expose privileged content.

The most important member-facing defect was a false unauthenticated message during NextAuth session establishment. The Member Messages page was updated to distinguish session loading from a confirmed unauthenticated state. It now waits for session resolution before showing a login-required message and passes the resolved user ID into the shared chat interface.

My Stays received branded property-card skeletons for asynchronous loading. Transport Guide received responsive guide-card skeletons. These changes prevent a transient loading state from appearing as a misleading empty or zero-result state.

The theme and motion system was unified across roles. The repository records shared duration and easing tokens and a more consistent cross-role visual system. The reviewed staging branch contained the message-session fix and dashboard skeleton improvements and reached a READY Vercel staging deployment.

The same audit identified remaining interface issues: Agent Viewings failed after loading, `/admin/safety` returned 404 despite a sidebar entry, Admin Partnerships could remain on an indefinite verification state, and Admin Payouts/Settings required a fresh authenticated session for reliable inspection.

### 24–25 August 2026 — Authentication theme, performance, responsive testing, authorization, CSP, and password security

A major security and quality phase addressed authentication surfaces, sign-out behavior, first paint, mobile testability, password changes, authorization isolation, and deployment alignment.

Authentication pages were given a route-aware light theme that overrides persisted dashboard dark-mode preferences during sign-in, registration, password recovery, reset, and Google-verification flows. Sign-out controls prepare the light authentication state before navigation.

Performance work moved the public hero image to optimized Next.js image handling, made scroll listeners passive, coalesced or cancelled animation work, scoped session providers to protected layouts, reused server-validated sessions, removed duplicate theme providers, and removed an intentionally blank initial page-transition state. Count-up behavior was made aware of reduced-motion preferences.

A reusable 375×812 Chromium DevTools Protocol smoke test was added. It checks route redirects, computed authentication-surface styles, persisted-dark home-to-sign-in behavior, document/body width, and horizontal overflow. The test covers public, authentication, member, agent, admin, and profile entry points.

The password-change flow became a shared authenticated server action. It validates the current password, enforces a 12–128 character replacement range, hashes with bcrypt, increments the session version, revokes stored sessions, and records a redacted security event. Member, Agent, and Admin profiles use the shared password-change dialog.

Authorization isolation and secret-hygiene work was added or expanded. The repository includes role and ownership checks, private-record tests, private-channel tests, admin denial tests, and negative isolation coverage.

The project’s package-manager metadata and lockfile were aligned with the pnpm installer used by Vercel. This corrected a deployment failure caused by patched-dependency configuration differences.

### 25–29 August 2026 — Security audit, deployment verification, monitoring runbooks, and provider controls

The repository records a broad security review during this period. The documented application controls include:

- Middleware route protection for Corp Member, Agent, and Admin workspaces.
- Banned-user checks in authenticated access decisions.
- Ownership checks for private records and member/agent workflows.
- CSRF and session-related protections.
- Safe redirects and private-IP/SSRF protections.
- Storage-key and file-path confinement.
- MIME, signature, size, count, and abuse controls for uploads.
- Security-event and audit-log recording.
- Content Security Policy and restrictive response headers.
- HSTS and anti-framing controls.
- Dependency and lockfile review.
- Password-change session revocation.
- Booking validation and concurrency-oriented safeguards.

One historical report recorded a Security Grade A, zero dependency advisories, protected private files, correct unauthenticated redirects, sanitized search input, and external payment isolation. A later and more detailed audit clarified that provider-side WAF, Bot Management, historical credential rotation, Cloudinary preset settings, and some browser coverage were not verified through the available access.

The project’s security documentation specifies eight categories of Vercel Firewall/Bot Management rules covering managed exploit detection, aggregate authentication limits, stricter credential and reset limits, upload limits, bot management, admin/Pusher/private-document protection, suspicious host/proxy-header blocking, and authenticated rate-limit keys. These rules are documented but must not be described as deployed until provider-side configuration and event evidence are captured.

The project also contains a continuous security monitoring runbook. It defines provider-native alerts, signed webhook collection, Vercel drains, Cloudflare event review, synthetic checks, redacted structured security events, retention limits, escalation levels, and weekly/monthly review cadence. The runbook is an operational design and checklist; it is not evidence that every proposed monitor or provider webhook has already been enabled.

### 30–31 August 2026 — Operational validation, production checks, and project-history management

The project log records a safe validation matrix covering deployment provenance, public HTTP health, runtime-error summaries, TypeScript, middleware security headers, filesystem/redirect/SSRF boundaries, role-route redirects, and Chromium mobile smoke behavior. Database-mutating production tests, payment tests, booking tests, and credential-dependent flows were intentionally excluded without isolated authorization.

The production deployment was recorded as READY and the public alias returned successful responses. Protected role routes redirected unauthenticated visitors, `/api/health` returned 200, protected operational endpoints returned 401, and the tested upload GET method returned 405. The recorded runtime finding was a `DEP0169` `url.parse()` deprecation warning associated with the NextAuth route, not a confirmed application failure.

An isolated Neon test project was created for non-production testing. The Prisma migration history was applied to the isolated database. A disposable authentication test account was used for an isolated auth lifecycle test, and the project log records fourteen authentication assertions passing, including OTP rejection, verified registration, CSRF issuance, failed and successful credentials login, session visibility, role identity, password non-disclosure, and member-route reachability. The disposable test records were cleaned up.

The project log was established as the append-only project-history index. It records decisions, actions, blockers, test results, deployment observations, and synchronization notes.

### 6 September 2026 — Repository restoration, synchronization, and this complete record

The requested `/home/ubuntu/NYSC` directory was not initially present in the active sandbox. The authorized GitHub repository was restored to that path. The current checkout is on `main` at recorded commit `94bce2f` with 478 tracked files.

The source file inventory was generated. A lean synchronization set was prepared and copied into the connected Windows folder:

`C:\Users\AKEEM\Downloads\Booking app wireframe (1)`

The synchronization included project source and documentation. It excluded `.git`, `node_modules`, `.next`, and `.env` to avoid transferring repository metadata, generated dependencies, build output, and secrets. The source was preserved. Key destination files, including `README.md` and `package.json`, were verified after the copy.

This complete `update.md` file was then created in the source repository to consolidate the historical record.

## Product capabilities implemented over the project history

| Capability area | Recorded implementation |
|---|---|
| Marketplace | Property browsing, categories, search, filters, listing details, comparisons, saved lodges, reviews, and PPA context |
| Corp Member workspace | Dashboard, marketplace, bookings, stays, messages, notifications, profile, premium, transport, nearby essentials, artisan directory, and offline entry points |
| Agent workspace | Properties, bookings, viewings, messages, reviews, analytics, leads, verification, settings, support, premium tools, and earnings/reference records |
| Admin workspace | Users, agents, artisans, disputes, audit logs, CMS content, property administration, notifications, metrics, payments references, and settings areas |
| Booking | Validated booking workflows, status changes, cancellation handling, concurrency safeguards, agent confirmation, and notification events |
| Payments | Premium Paystack readiness; server-side pricing and verification; idempotent callback/webhook design; external property-payment model |
| Messaging | In-app chat, session-aware member messaging, Pusher-related realtime architecture, phone and WhatsApp contact paths |
| Maps | PPA picker, property/PPA distance, Mapbox street routing, OSRM fallback, timeout protection, and graceful degradation |
| Nearby essentials | Live provider search, curated Nigerian fallbacks, healthcare/bank/transport/security categories, regional coverage, and 30 km search behavior |
| Media | Cloudinary-oriented upload flow with application-level authentication, MIME/signature checks, size/count limits, generated identifiers, and origin validation |
| Content | CMS-backed transport guides covering Nigerian states and Abuja |
| Auditing | Security events, application audit logs, deployment reports, test artifacts, and append-only project history |

## Security audit summary

The security work can be grouped into application perimeter, identity, authorization, data and file handling, payment integrity, observability, and provider-edge controls.

### Application perimeter

The application uses middleware and server-side checks to protect role routes before page rendering. The documented response controls include HTTPS enforcement through HSTS, anti-framing, MIME-sniffing prevention, restrictive permissions policy, CSP directives, and origin-aware behavior.

### Authentication and identity

Authentication work includes OTP gating, credentials login, Google verification flow support, session checks, banned-user enforcement, password changes, session-version invalidation, stored-session revocation, and redacted security events. Authentication surfaces use an intentional light theme independent of persisted dashboard preference.

### Authorization and privacy

Role-based access is enforced for `/member`, `/agent`, and `/admin` areas. Ownership and private-record checks cover booking, property, messaging, and related business data. Negative tests cover cross-account isolation and privileged-route denial. The application does not rely only on client-side role visibility for protected behavior.

### SSRF, redirects, files, and uploads

The repository contains safe outbound-fetch and redirect utilities, private-IP protection, storage-key validation, file-path confinement, upload signature and MIME checks, generated identifiers, size/count limits, and abuse controls. The focused test suite recorded passing redirect, SSRF, storage, and path-confinement assertions.

### Payment integrity

Paystack readiness work uses server-side pricing, transaction verification, HMAC-SHA512 webhook validation, amount/currency/reference checks, idempotent processing, safe retry behavior, and non-premium failure states. The project does not treat a browser redirect as sufficient proof of payment. Live premium activation remains subject to business/provider approval and controlled testing.

### Remaining security work

Historical credentials require provider-side rotation evidence. Vercel Firewall and Bot Management rules require actual provider configuration and event verification. Cloudinary preset settings require console confirmation or migration to signed server-side upload. Cross-browser and authenticated mobile checks remain incomplete. These are not represented as finished in this record.

## UI/UX change summary

The most important documented UI/UX changes are:

1. **Authentication light mode.** Authentication surfaces now resist persisted dashboard dark mode and remain visually consistent across sign-in, registration, recovery, reset, and Google verification.
2. **Sign-out transition consistency.** Member, Agent, Admin, profile, and mobile logout controls prepare the authentication theme before navigation.
3. **Messages session handling.** The Member Messages page no longer shows a false login-required error while the session is loading.
4. **Branded skeleton states.** My Stays and Transport Guide use layout-matching skeleton cards during asynchronous data loading.
5. **PPA selector simplification.** The member profile flow was streamlined around pinning the exact PPA location on the map rather than presenting redundant location inputs.
6. **Agent contact access.** Obsolete launch-time chat/contact gates were removed so authenticated users can use in-app messaging, phone, and WhatsApp paths.
7. **Commute routing.** Straight-line approximations were replaced or supplemented with street-level Mapbox routing and OSRM fallback.
8. **Nearby Essentials clarity.** Categories and provider fallbacks were expanded to make local services more useful and resilient.
9. **Performance and first paint.** Hero image handling, session-provider scope, scroll work, animation cancellation, theme-provider duplication, and initial page-transition behavior were improved.
10. **Mobile testability.** A repeatable 375×812 route and overflow smoke test was added.
11. **Reduced motion.** Animation and count-up behavior were made more aware of user motion preferences.
12. **Role workspace review.** Dashboard journeys, empty states, loading states, premium gates, active-tab behavior, location feedback, and role redirects were reviewed.

## Automations, scheduled tasks, and operational workflows

The repository contains both executable automation and documented automation designs. The distinction matters because a script existing in source does not prove that its production schedule or provider integration is active.

| Automation or workflow | Evidence and current interpretation |
|---|---|
| Booking validation and throttling | Implemented in application workflows and recorded in launch-hardening commits |
| Booking status notifications | Implemented through notification records and related services |
| Realtime notifications | Pusher-related listener and server integration are present; provider credentials/configuration must be verified separately |
| Premium expiry reminders | Scripts/services are present; production schedule requires `CRON_SECRET` and deployment configuration |
| Paystack webhooks | Signature validation, transaction re-verification, idempotency, and retry-safe behavior are documented |
| Audit events | Implemented for security-sensitive and administrative actions |
| Transport and test data seeding | Scripts are present; production use requires explicit authorization |
| Scheduled cron configuration | Vercel Hobby-compatible schedule fixes are recorded; current provider schedule status must be checked before claiming it is active |
| Responsive smoke test | Repeatable with `pnpm test:responsive` |
| Full audit runner | Repeatable with `bash scripts/run-final-audit.sh` |
| Continuous security monitoring | Runbook defines Vercel, Cloudflare, synthetic, logging, and escalation workflows; provider enablement is not fully evidenced |
| This-session file synchronization | Completed as a one-time copy; no recurring synchronization automation was created |

## Validation record

| Check or evidence | Recorded result | Qualification |
|---|---|---|
| TypeScript no-emit | Pass | Documented on the reviewed checkout |
| Dependency audit | Pass | Reported zero advisories at the checked severity levels |
| Production build | Pass in the final local audit | Build includes migration-related behavior; production execution requires care |
| Authentication E2E | Pass | Passed in isolated local environment after server startup |
| Authorization isolation | Pass | Passed after local-origin correction |
| Authorization policy | Pass | Role and ownership checks passed |
| Password change | Pass | Password update and session revocation passed |
| Business flows | Pass | Isolated business flow passed |
| Role integration smoke | Pass | Role boundary checks passed |
| Security baseline | Pass | Reusable baseline exited successfully |
| Redirect/SSRF/file suite | Pass | Focused boundary checks passed |
| CSP/header suite | Pass | Nonce, directives, anti-framing, HSTS, and related assertions passed in the documented run |
| Responsive smoke | Mixed | One final audit recorded 12/12 overall and responsive pass; a later operational review recorded `/signup` failure |
| Production public HTTP checks | Pass | Public and health endpoints returned expected responses in read-only checks |
| Authenticated production rendering | Incomplete | Connected browser session was not consistently observable as authenticated |
| Native Firefox/Safari coverage | Incomplete | Available environment was Chromium-based |
| Provider Firewall evidence | Unverified | Integration did not expose the required rule/event evidence |
| Credential rotation | Pending/unverified | Provider-side revocation and replacement evidence is required |

## Open issues and recommended next actions

### Product and UI/UX

- Implement `/admin/safety` or remove/replace the sidebar link.
- Investigate the Agent Viewings runtime failure.
- Add timeout and error treatment to Admin Partnerships.
- Add stable table skeletons to Agent Bookings and remaining data-heavy dashboards.
- Use a shared Premium feature-preview pattern for Notifications, Artisan Directory, and Offline Mode.
- Add a non-sensitive role-redirect notice.
- Repeat authenticated member, agent, and admin mobile checks with an authorized test session.
- Complete cross-browser checks with real Firefox and WebKit/Safari engines or an approved equivalent.

### Security and operations

- Rotate historical Resend and NextAuth credentials and invalidate affected sessions/tokens.
- Configure and verify the documented Vercel Firewall and Bot Management controls.
- Confirm Cloudinary preset restrictions or move to signed server-side uploads.
- Investigate the recorded `DEP0169` `url.parse()` warning in the authentication route.
- Maintain dependency, lockfile, and security-baseline checks in the release process.
- Configure and verify monitoring, redacted event collection, retention, alert routing, backups, and rollback procedures.
- Complete Paystack business review and test-mode validation before any live premium activation.
- Verify Pusher production credentials if realtime notification delivery is required.

### Deployment and data safety

- Do not run the production build or migration scripts against production without explicit database authorization.
- Use isolated databases for registration, booking, payment, and business-flow tests.
- Confirm the exact production commit and deployment alias before making production claims.
- Keep secrets in encrypted provider variables and never commit or transfer them in project archives.

## Current-session actions recorded on 6 September 2026

The following actions were performed in this session and are separate from historical website development:

1. Restored the authorized GitHub repository into `/home/ubuntu/NYSC` because the path was not initially present in the sandbox.
2. Listed the source files and generated a 506-entry inventory including repository metadata.
3. Prepared a lean 478-file project set excluding `.git`, `node_modules`, `.next`, and `.env`.
4. Synchronized that project set into the connected Booking app wireframe folder on the Windows computer.
5. Verified copied `README.md` and `package.json` in the destination.
6. Preserved the source repository and did not delete production data, application records, credentials, or provider settings.
7. Created and verified this complete `update.md` file.

## References

[1]: PROJECT_LOG.md "Append-only project history and session record"
[2]: docs/FINAL_PROJECT_AUDIT.md "NYSC Final Project Audit"
[3]: docs/FINAL_VERIFICATION_AND_AUDIT_REPORT.md "Final Production Verification and Technical Audit Report"
[4]: docs/SECURITY_AUDIT_REPORT.md "Comprehensive Security Audit and Vulnerability Scan Report"
[5]: docs/OPERATIONAL_REVIEW_AND_REGRESSION_STATUS_2026-08-30.md "Operational Review and Regression Status"
[6]: docs/ui-ux-dashboard-journey-audit-2026-08-17.md "NYSC Dashboard Journey and UI/UX Audit Report"
[7]: docs/CONTINUOUS_SECURITY_MONITORING_AND_HARDENING_CHECKLIST.md "Continuous Security Monitoring and Hardening Checklist"
[8]: docs/PAYMENT_LAUNCH_CHECKLIST.md "Paystack Launch Checklist"
[9]: docs/SECURITY_AUDIT_SUPPLEMENT.md "Security Audit Supplement"
[10]: docs/SECURITY_EDGE_CONTROLS.md "Security Edge Controls"
[11]: docs/AUTHORIZATION_INVENTORY.md "Authorization Inventory"
[12]: https://github.com/akeemadetunji1234-wq/NYSC "NYSC GitHub Repository"
[13]: https://nysc-mu.vercel.app "Neat & Affordable Production Application"


## 7 September 2026 — React error remediation and documented UI follow-up

Production runtime evidence identified React error #441 as the result of expected user-validation failures being thrown from Server Actions. Incorrect current passwords, unverified premium purchasers, and Paystack checkout rate-limit responses were changed to structured failure results consumed by the client as toast messages. Unexpected database and provider failures remain exceptions for observability. The change was committed as `c78ab49`, passed `pnpm exec tsc --noEmit` and `git diff --check`, and reached a READY production deployment at `https://nysc-mu.vercel.app`.

The remaining route-level UI issues from the earlier audit were addressed in commit `5aad5dc`. `/admin/safety` now renders a real safety and operations landing page linking to Listing Safety, Production Monitoring, and Audit Logs. Agent Viewings now distinguishes loading, empty, and failed states, provides a retry action, guards nullable member/property display data, and uses a safe native image fallback rather than requiring Next Image remote optimization for the list. Admin Partnerships now applies a ten-second timeout, clears stale rows on failure, logs the error without exposing details, and presents a recoverable retry state instead of leaving an indefinite loading message. The commit passed TypeScript and whitespace validation and was pushed to `main`; Vercel deployment completion remains subject to the provider build status.

The connected browser was used to inspect the live Agent Viewings URL. Because the connected browser did not have an authenticated session for the requested Agent role, the site correctly redirected to `/signin?callbackUrl=%2Fagent%2Fviewings`. Authenticated cross-browser and mobile rendering therefore remain **not validated**; they require an authorized test session and real Firefox/WebKit/Safari or equivalent browser contexts. No credentials were requested, copied, or stored.

A read-only Vercel project-protection check confirmed Vercel Authentication is enabled for all deployment URLs except custom domains, while password protection and trusted-IP protection are disabled. The available Vercel integration does not expose Firewall/Bot Management rules or event analytics, so provider-side WAF configuration and deny/challenge evidence remain **unverified** rather than claimed complete.

Historical Resend and NextAuth credential rotation was not performed. Rotation requires the authenticated provider workflow, replacement values, encrypted deployment-variable updates, and session/token invalidation; it is a high-impact action and must be authorized and executed with provider access. Cloudinary upload-preset settings and Paystack live-mode activation likewise remain provider-side evidence items. The repository does not contain or record any secret values.

### Current residual evidence matrix

| Area | Current status | Evidence or next action |
|---|---|---|
| React error #441 paths | Remediated and deployed | Expected Server Action validation failures now return structured results; production commit `c78ab49` is READY. |
| Admin Safety route | Implemented | Real `/admin/safety` landing page in commit `5aad5dc`. |
| Agent Viewings route | Hardened | Loading, timeout/error, retry, and nullable-data handling added; authenticated production verification still pending. |
| Admin Partnerships loading | Hardened | Ten-second timeout and retry state added; authenticated production verification still pending. |
| Vercel Firewall/Bot Management | Unverified | Available integration exposes deployment protection, not Firewall rules/events; verify in Vercel dashboard. |
| Historical credential rotation | Pending | Rotate only through Resend/NextAuth provider workflows, then update encrypted deployment variables and invalidate affected sessions/tokens. |
| Cloudinary preset hardening | Unverified | Confirm provider resource type, MIME/size/transformation limits, overwrite/folder restrictions, and signed-upload policy. |
| Paystack live integration | Controlled/pending evidence | Complete test-mode, signature, amount/currency, idempotency, reconciliation, monitoring, and explicit live-mode authorization checklist. |
| Cross-browser authenticated rendering | Not complete | Use an authorized session in Firefox/WebKit/Safari or equivalent. |
| Authenticated mobile rendering | Not complete | Repeat protected-route checks with an authorized mobile viewport/session. |
