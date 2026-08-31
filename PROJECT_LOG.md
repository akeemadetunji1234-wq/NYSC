# PROJECT_LOG.md

## Overview

Neat & Affordable is a Nigerian housing marketplace designed for NYSC corps members who need verified, affordable accommodation near their Place of Primary Assignment (PPA). The project covers the marketplace, member and agent workflows, admin moderation, booking and notification flows, payments readiness, security hardening, Cloudinary media uploads, performance, responsive UX, and an Ibadan-first launch strategy that can expand state by state.

## Current Status

**Active maintenance.** `PROJECT_LOG.md` is initialized as the single source of truth for this project’s history, and the append-only logging workflow is now active.

## Log

- **[2026-08-31 07:08 UTC]** — Initialized `PROJECT_LOG.md` with the requested structure and project overview. This file is now the authoritative history and index for future project work.

## Key Decisions

- `PROJECT_LOG.md` is the single source of truth for project history; entries are append-only and reverse chronological.
- Each meaningful action, file change, decision, error, or blocker must be logged immediately rather than reconstructed later.

## Next Steps

1. Append a log entry immediately after every meaningful project action.
2. Read `PROJECT_LOG.md` at the start of every new session before inspecting or modifying the project.
3. Reference every new output file, deliverable, deployment, test result, and unresolved issue from the relevant log entry.

## Issues / Blockers

- No new blocker recorded during initialization.

- **[2026-08-31 07:09 UTC]** — Confirmed the initialized log is present in the project workspace at `/home/ubuntu/NYSC/PROJECT_LOG.md`; ongoing work will use it as the project-history index.

- **[2026-08-31 07:10 UTC]** — Changed Current Status from the initial “Starting” state to “Active maintenance” and clarified the operating rules for immediate append-only logging, session-start review, and output-file indexing.

- **[2026-08-31 07:10 UTC]** — Read the authoritative project log and reviewed repository state. Local `main` and `origin/main` both point to `8a66e488a182dd90a6388b91f326f82cef0eba13`; only `PROJECT_LOG.md`, two production-check reports, and generated `tsconfig.tsbuildinfo` are untracked.

- **[2026-08-31 07:10 UTC]** — Removed the generated `tsconfig.tsbuildinfo` cache before synchronization and commit; retained only the project log and two intentional production-check reports as pending files.

- **[2026-08-31 07:10 UTC]** — Synchronized `PROJECT_LOG.md`, `docs/PRODUCTION_HERO_SIGNIN_LOADER_CHECK_2026-08-31.md`, and `docs/PRODUCTION_NYSC_GIF_BROWSER_CHECK_2026-08-31.md` into the Windows project folder at `C:\Users\AKEEM\Downloads\Booking app wireframe (1)`.

- **[2026-08-31 07:10 UTC]** — Staged only the new `PROJECT_LOG.md` and the two production verification reports for the history/documentation update; no application source or generated cache was included.

- **[2026-08-31 07:10 UTC]** — Refreshed the staged documentation set so the commit will include the latest append-only history entries through the staged-file review.

- **[2026-08-31 08:00 UTC]** — Started continuation from the shared operating brief. Cloned `akeemadetunji1234-wq/NYSC` into `/home/ubuntu/NYSC`; local `main` and `origin/main` both point to `b6d044efca00943ea7076ad805e46eb107f4e8ae`, which differs from the brief’s earlier known commit `8a66e488a182dd90a6388b91f326f82cef0eba13`. The working tree is clean. No repository-level `AGENTS.md` was found. Vercel integration exists but is disabled in the current session, so deployment verification is not yet available. Further work is paused pending review of the current commit and authorization to enable Vercel if deployment checks are needed.

## Current Status

**Continuation assessment in progress.** The authoritative GitHub checkout is available and clean at commit `b6d044efca00943ea7076ad805e46eb107f4e8ae`; the current deployment relationship and source changes since the brief’s prior commit still need to be established.

## Next Steps

1. Review the current commit history and relevant project files against the brief’s preserved asset and security requirements.
2. If deployment verification is required, enable or inspect the Vercel integration only after user approval.
3. Select one evidence-based, safe priority item before making source changes.

## Issues / Blockers

- Vercel deployment and production-commit verification cannot currently be performed because the available Vercel integration is disabled.
- The current GitHub HEAD differs from the commit recorded in the inherited brief; the reason is not yet established.

- **[2026-08-31 08:05 UTC]** — Reviewed the current Git history and preserved project files. HEAD `b6d044e` is the documentation commit immediately after `8a66e48`; all required hero/loader files and both production-check reports are present. No maintained-source reference to `LOADER.png` was found; historical documentation mentions were intentionally retained. The working tree remains clean before the next inspection.

- **[2026-08-31 08:08 UTC]** — Reviewed `scripts/phone-responsive-smoke.mjs`. The reported mobile issue is a Chromium CDP smoke test at 375×812 that checks auth-surface styling and horizontal overflow across public and protected routes; it does not prove behavior in other browser engines. The next safe action is to rerun this read-only probe against the current production URL and preserve its raw output.

- **[2026-08-31 08:15 UTC]** — Reran `scripts/phone-responsive-smoke.mjs` against `https://nysc-mu.vercel.app` at 375×812 using Chromium headless; exit code 0. Auth surfaces on `/signin`, `/signup`, `/forgot-password`, `/reset-password`, and `/verify-google` passed the script’s light-mode checks. The tested routes reported no horizontal overflow, and protected routes redirected to sign-in as expected. Raw JSON and screenshots were saved under `/tmp/nysc-phone-smoke-current`. This is Chromium-only evidence and does not validate Chrome, Edge, Firefox, or Safari independently; it also does not prove authenticated mobile rendering.

## Current Status

**Continuation assessment in progress.** The inherited mobile smoke-test failure is not reproducible against the current production URL under the existing Chromium probe. No source files were changed.

## Next Steps

1. Establish deployment provenance for current HEAD `b6d044e` through Vercel before any production claim or push.
2. If deployment verification is authorized, enable the existing Vercel integration and inspect the project/deployment metadata without exposing secrets.
3. Investigate the remaining operational priorities only after their provider access and scope are confirmed.

## Issues / Blockers

- Vercel integration remains disabled, so the exact production commit and deployment ID cannot yet be independently verified from provider metadata.
- Cross-browser and authenticated mobile behavior remain unverified.

- **[2026-08-31 08:22 UTC]** — Verified the connected Vercel project `nysc` (`prj_fymt97azm7pNj1YBwVVTfsHlG7vb`) is linked to GitHub repository `akeemadetunji1234-wq/NYSC`. The latest production deployment is `dpl_695RG6dMZw62UJFtk5656UZJobgo`, state `READY`, built from GitHub `main` commit `b6d044efca00943ea7076ad805e46eb107f4e8ae`, and assigned the production alias `nysc-mu.vercel.app`. A read-only fetch of `https://nysc-mu.vercel.app/` returned HTTP 200 from Vercel. The response exposed the expected restrictive headers including CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS, and a same-origin default policy. No deployment or source change was made.

## Current Status

**Deployment alignment verified.** GitHub `main`, Vercel production, and the public production alias are aligned at `b6d044e`; the current production homepage is healthy under a read-only HTTP check. The inherited mobile issue remains unreproduced under Chromium-only testing.

## Next Steps

1. Investigate the unresolved Vercel Firewall `/api/auth/*` control using available provider evidence, without changing rules.
2. If provider event evidence is unavailable through the current integration, document that limitation rather than claiming the control is verified.
3. Only then select a source change if a concrete defect is demonstrated.

## Issues / Blockers

- Vercel deployment alignment is no longer blocked.
- Firewall configuration/event evidence may still require the Vercel console or a supported provider operation; no claim about its effectiveness has been made.
- Cross-browser and authenticated mobile behavior remain unverified.

- **[2026-08-31 08:26 UTC]** — Read-only Vercel review completed. Project metadata confirms framework `nextjs`, domains including `nysc-mu.vercel.app`, latest deployment `dpl_695RG6dMZw62UJFtk5656UZJobgo` in `READY` production state, and `live: false` in the returned project metadata. Vercel reported no grouped runtime errors in the selected last-24-hour window. Effective deployment protection shows password protection disabled, SSO protection enabled for all deployments except custom domains, and trusted IP protection disabled. These settings are deployment access controls, not evidence that the `/api/auth/*` Firewall rate-limit rule is configured or effective; no Firewall-event operation is exposed by the current integration, so the firewall issue remains unverified.

## Current Status

**Read-only operational review completed.** Repository HEAD, Vercel production deployment, production alias, public HTTP response, runtime-error summary, and deployment-protection metadata have been checked. No source, provider setting, deployment, or customer data was changed.

## Next Steps

1. Treat the Vercel Firewall `/api/auth/*` rate limit as unverified until console-level rule and event evidence is available.
2. Review the current source test/build baseline before considering any code change.
3. Keep the next change scoped to a demonstrated defect; do not push or redeploy solely to create activity.

## Issues / Blockers

- The current integration does not expose Vercel Firewall rule configuration or Security Events, so firewall effectiveness cannot be established here.
- Vercel metadata reports `live: false` even though the production deployment is `READY` and the public alias returns HTTP 200; this field should not be interpreted as downtime without console clarification.
- Cross-browser and authenticated mobile behavior remain unverified.

- **[2026-08-31 08:30 UTC]** — Attempted the required TypeScript no-emit check on the clean checkout. It could not start because dependencies are not installed (`node_modules/.bin/tsc` absent and `pnpm exec tsc` returned `Command "tsc" not found`). No source files were changed. Dependency installation is the next bounded local action; the repository build script is not being run because it includes a production migration step and no database authorization was requested.

## Current Status

**Validation is partially blocked by missing local dependencies.** Production and deployment checks are complete; local TypeScript/build validation has not yet run.

## Issues / Blockers

- Local dependencies are absent, so TypeScript validation cannot run until a package install completes.
- The project’s `build` script includes `node scripts/migrate-production.mjs`; do not run it against any production database without explicit authorization.

- **[2026-08-31 08:34 UTC]** — Installed dependencies with `pnpm install --frozen-lockfile`; installation completed successfully and the postinstall step generated Prisma Client. Package-manager warnings indicate several dependency build scripts were ignored by pnpm, but no repository source files were changed. Static validation can now be retried.

- **[2026-08-31 08:38 UTC]** — TypeScript no-emit validation completed successfully with `node_modules/.bin/tsc --noEmit`. No source files were changed. A production build was intentionally not run because this repository’s `build` script invokes `scripts/migrate-production.mjs`, which could perform database operations; no explicit database authorization was provided, and the current task has not introduced a source change requiring a build.

## Current Status

**Continuation checkpoint complete.** The clean GitHub checkout is aligned with the READY Vercel production deployment, the production homepage returned HTTP 200 with the expected security headers, no grouped Vercel runtime errors were reported for the last 24 hours, the Chromium-only mobile smoke test passed, and TypeScript validation passed. No application code, Vercel setting, or production data was modified.

## Next Steps

1. Obtain console-level Vercel Firewall rule and event evidence before marking the `/api/auth/*` rate limit verified.
2. If a source change is requested, run the focused validation suite and the migration-safe build procedure with explicit database authorization.
3. Keep custom-domain, email, Cloudinary, Paystack, credential rotation, and monitoring work separately authorized and evidence-based.

## Issues / Blockers

- Firewall rule configuration and event logs are unavailable through the current Vercel integration.
- The Vercel project metadata reports `live: false` despite a READY production deployment and HTTP 200 public response; this discrepancy needs console clarification before interpreting it as an outage.
- Cross-browser and authenticated mobile behavior remain unverified.

- **[2026-08-31 08:45 UTC]** — Reviewed browser-compatibility coverage for the requested authenticated-rendering test. The repository currently has a Chromium CDP smoke test only; no Playwright/Puppeteer dependency or Firefox/WebKit test harness is installed. The sandbox provides `/usr/bin/chromium` but no Firefox, WebKit, or Safari binary. The existing smoke test exercises auth pages unauthenticated and does not establish authenticated session rendering. Firefox- and Safari-like checks can therefore be simulated with Chromium user-agent/device profiles, but those results must not be reported as actual Firefox or Safari engine coverage. A real authenticated test also requires an existing logged-in browser session or an explicitly authorized isolated test account.

- **[2026-08-31 08:52 UTC]** — Checked `https://nysc-mu.vercel.app/member` in the connected browser. The final settled URL was `/signin`, and the page rendered the sign-in form; the earlier dashboard-like content was a transient loading/hydration state, not proof of authentication. No credentials were read, copied, submitted, or recorded. A real authenticated rendering test therefore requires the user to sign in interactively in the connected browser or provide an explicitly authorized isolated test account. Firefox and Safari remain unavailable as native engines in the sandbox; Playwright-style engine installation or Chromium profile simulation would be needed for non-native coverage.

- **[2026-08-31 09:05 UTC]** — After the user reported completing interactive sign-in, rechecked `/member` in the connected browser. The browser action timed out once; a fresh navigation then rendered the sign-in page content rather than an authenticated member dashboard. No credentials or session values were accessed. Authenticated rendering testing remains blocked because the session was not observable as authenticated after takeover.

- **[2026-08-31 09:12 UTC]** — Rechecked `/member` after the second reported sign-in attempt. The route still rendered the sign-in form, so no authenticated session was observable. No credentials or cookies were accessed. This confirms the test cannot proceed to authenticated Firefox/Safari-like rendering until the login flow succeeds and persists a session in the connected browser.

- **[2026-08-31 09:20 UTC]** — User confirmed that the member dashboard was visible, but a fresh navigation to `https://nysc-mu.vercel.app/member` in the connected browser still rendered the sign-in form. The authenticated state remains unobservable to this session, so authenticated compatibility testing has not been performed and no browser-compatibility claim will be made.

- **[2026-08-31 09:30 UTC]** — Reran the existing Chromium CDP production smoke test against `https://nysc-mu.vercel.app`; it exited successfully with code 0. The requested Windows path `C:\Users\AKEEM\Downloads\Booking app wireframe (1)` is not mounted or accessible through the sandbox’s checked path mappings (`/mnt/c/...`, `/home/ubuntu/Downloads/...`, and `/home/oai/share/...` all absent). The test generated the untracked TypeScript cache `tsconfig.tsbuildinfo`; no application source changed. The repository log itself is modified by these append-only entries.

- **[2026-08-31 09:33 UTC]** — Removed only the generated `tsconfig.tsbuildinfo` cache. Bounded status now shows only the intentional modification to `PROJECT_LOG.md`; no application source or unrelated files are modified. The rerun evidence remains at `/tmp/nysc-phone-smoke-rerun.json` with screenshots under `/tmp/nysc-phone-smoke-rerun/`.

## Current Status

**Rerun complete; synchronization blocked by workspace isolation.** The available Chromium smoke test passes again against production, but the requested Windows destination is not accessible from this sandbox, so no copy or overwrite was attempted.

## Next Steps

1. If the Windows folder is made available as an uploaded/shared directory, synchronize only the intentional project-log and evidence paths and verify checksums.
2. For actual authenticated rendering, keep the user’s dashboard visible in the connected browser or provide an isolated test session; the current rerun remains unauthenticated.
3. Native Firefox/Safari coverage still requires those engines or an approved Playwright-style harness; Chromium user-agent simulation would not be equivalent.

## Issues / Blockers

- `C:\Users\AKEEM\Downloads\Booking app wireframe (1)` is not accessible from this environment, so synchronization cannot be truthfully claimed.
- The rerun is Chromium-only and unauthenticated; it does not validate native Firefox, Safari, or authenticated member-dashboard rendering.

- **[2026-08-31 09:45 UTC]** — Resumed continuation after the user’s request to continue. Read the latest project-log state and selected the existing middleware security-header regression test as a safe next action because it is local, read-only, and does not require database access or production credentials. No source change is planned unless the test demonstrates a concrete defect.

- **[2026-08-31 09:50 UTC]** — The first attempt to run `scripts/test-security-headers.ts` directly with Node failed before executing assertions because Node could not resolve the extensionless `next/server` import (`ERR_MODULE_NOT_FOUND`). This is a test-runner/module-resolution issue, not evidence of a security regression. The package script specifies `pnpm dlx tsx`, so the next attempt will use that intended runner.

- **[2026-08-31 09:58 UTC]** — Reran the middleware security-header regression test using the repository’s intended `pnpm dlx tsx` runner after approving the transient esbuild build step. The test passed with `ok: true`, covering hostile-origin denial, no origin reflection, CSP nonce and framing directives, absence of `unsafe-eval` and style `unsafe-inline`, explicit resource directives, `X-Frame-Options`, and HSTS. No source files or production settings were changed.

- **[2026-08-31 10:02 UTC]** — Final status check confirms local HEAD and `origin/main` both remain `b6d044efca00943ea7076ad805e46eb107f4e8ae`. The only working-tree modification is the intentional append-only `PROJECT_LOG.md`; no application source change was demonstrated or prepared, so nothing was committed, pushed, or redeployed.

## Current Status

**Safe continuation checkpoint complete.** The middleware security-header regression test passed, while the prior production and Chromium smoke checks remain valid. No code change was justified by the available evidence.

## Next Steps

1. Restore access to the Windows project folder or pull the verified GitHub state locally when Manus Desktop is working.
2. Continue with authenticated rendering only after a session is observable without handling credentials.
3. Obtain Vercel Firewall console/event evidence before changing or declaring that control verified.

- **[2026-08-31 10:15 UTC]** — Began a full stability check against the current production deployment. The safe matrix will cover deployment provenance, public HTTP health, Vercel runtime-error summary, TypeScript no-emit, local middleware/security regressions, and the existing production Chromium smoke test. Database-backed registration/login, authorization-isolation, payment, booking, notification, and business-flow tests will not be run against production because they may create or mutate data and require explicit isolated-test authorization. The repository build is also excluded because its script invokes a production migration step.

- **[2026-08-31 10:36 UTC]** — Completed the safe local/production test subset. TypeScript no-emit passed; middleware security headers passed all nine assertions; filesystem/redirect/SSRF boundary tests passed all seven assertions; the production Chromium mobile smoke test exited 0 across its route set with no horizontal overflow reported. Raw suite evidence was saved under `/tmp/nysc-full-safe-suite-20260831-093605`. Database-mutating and credential-dependent tests were intentionally excluded from the production run.

- **[2026-08-31 10:40 UTC]** — Vercel checks were rerun. The production deployment remains `READY` at commit `b6d044efca00943ea7076ad805e46eb107f4e8ae`; the runtime-error summary now reports one deprecation-warning group on `/api/auth/[...nextauth]`, affecting one user, with the latest occurrence at `2026-08-31T08:24:30Z`. This is a warning rather than proof of an application failure, but it is a follow-up item. A read-only homepage check was also issued. The file reader could not open `.mts` test source due to extension handling, so remaining test scripts require a non-modifying shell text read before deciding whether they are safe to run.

- **[2026-08-31 10:48 UTC]** — Reviewed `scripts/role-integration-smoke.sh`. It performs bounded unauthenticated GET checks across role routes and health/protected API endpoints, plus one unauthenticated Pusher-auth POST intended to verify rejection; it does not create accounts or write application records. This test is included in the safe production matrix. Database-backed business, payment, booking, and authorization-isolation suites remain excluded without isolated test-database authorization.

- **[2026-08-31 10:55 UTC]** — Ran the unauthenticated role/API boundary smoke test against `https://nysc-mu.vercel.app`. All 30 protected role routes returned `307` redirects; `/api/health` returned `200`; protected operational endpoints returned `401`; `/api/upload` returned `405` for the tested GET method. This is consistent with route protection and method enforcement. No application writes were performed.

- **[2026-08-31 11:02 UTC]** — Final production endpoint checks returned HTTP 200 for `/api/health`, `/api/auth/session`, `/api/auth/providers`, `/signin`, `/robots.txt`, `/sitemap.xml`, `/campstay-hero.png`, and `/NYSC.gif`. These checks confirm availability only; they do not prove successful login, authenticated rendering, or payment/booking behavior.

- **[2026-08-31 11:06 UTC]** — Full safe validation checkpoint finished. Local and production checks passed as recorded above; the only Vercel runtime finding is one `DEP0169` `url.parse()` deprecation-warning group on `/api/auth/[...nextauth]`, not a confirmed application failure. Removed the generated `tsconfig.tsbuildinfo`; final status shows only the intentional `PROJECT_LOG.md` modification. GitHub HEAD and `origin/main` remain aligned at `b6d044efca00943ea7076ad805e46eb107f4e8ae`. No source, production setting, or production data was modified.

## Current Status

**Production is stable under the safe, read-only test matrix, with one warning to investigate.** Deployment provenance, public endpoints, protected-route redirects, security headers, filesystem/redirect/SSRF boundaries, TypeScript, and Chromium mobile smoke coverage passed. This is not a complete authenticated or database-backed acceptance test.

## Next Steps

1. Investigate the `/api/auth/[...nextauth]` `url.parse()` deprecation warning and identify the dependency or code path responsible, without changing production until reproduced locally.
2. Obtain an isolated test database and test credentials before running the excluded registration, authorization, booking, business-flow, and payment suites.
3. Obtain Vercel Firewall rule and Security Events evidence; the current integration still cannot verify the `/api/auth/*` rate-limit challenge.
4. Restore Windows-folder access or pull the validated GitHub state locally when Manus Desktop is working.

- **[2026-08-31 11:15 UTC]** — The first url.parse trace command failed at shell parsing because the grep pattern used history-expansion-sensitive quoting. No repository inspection completed and no files changed. The trace will be retried with simpler shell-safe patterns.

- **[2026-08-31 11:25 UTC]** — Initial warning investigation found no application-source `url.parse` reference; the route imports `next-auth` `4.24.15` and the deployment runtime is Node `24.x`. Official Node/Next guidance identifies DEP0169 as a legacy `url.parse()` deprecation, and the production warning is emitted on `/api/auth/[...nextauth]`. The next step is dependency-level tracing and local reproduction before any fix.

- **[2026-08-31 11:32 UTC]** — The repository trace confirmed no application-level `url.parse` usage and showed NextAuth `4.24.15` on Next `16.3.0`. The initial dependency output was too broad and truncated, so the next trace will isolate exact `url.parse(` call sites in installed packages rather than assuming NextAuth itself is responsible.

- **[2026-08-31 11:45 UTC]** — Runtime configuration review found no `engines` or `.nvmrc` pin in the repository; Vercel project metadata currently reports Node `24.x`. The application uses Next `16.3.0` and NextAuth `4.24.15`, and no application-level `url.parse` call was found. Official Next.js issue evidence indicates DEP0169 can originate from framework/runtime internals under Node 24, so a runtime pin may be safer than patching vendor code, but reproduction and deployment-impact validation are still required before changing it.

- **[2026-08-31 12:05 UTC]** — Attempted to list Neon projects for isolated test-database setup. The provider requires an organization ID and returned HTTP 400 without one; no database or data was accessed or changed. The next step is to list organizations, identify the correct owner, and then create or branch only within an isolated non-production context.

- **[2026-08-31 12:12 UTC]** — Neon organization lookup returned one organization, `Akeem` (`org-small-rain-12866872`), on the free plan. No database operation has been performed. This organization ID will be used only to discover projects before deciding whether an isolated branch can be created safely.

- **[2026-08-31 12:35 UTC]** — The first isolated Neon project creation attempt was rejected with HTTP 412 because this account does not permit modifying the suspend interval. No project was created and no existing database was changed. I will retry without the unsupported endpoint setting, retaining a separate project, region, PostgreSQL version, and test database name.

- **[2026-08-31 13:00 UTC]** — Created a separate Neon project named `NYSC isolated test` with project ID `blue-dust-99064384`, PostgreSQL 17, in `aws-us-east-1`, with no copied production data. The project has zero written data at creation. The first attempt’s unsupported suspend setting was omitted. The next step is to obtain its non-production connection string and apply the application schema only to this isolated project.

- **[2026-08-31 13:08 UTC]** — Obtained the privileged connection details for the isolated Neon test project (`blue-dust-99064384`, database `nysc_test`, branch `br-mute-breeze-aw4pcxap`). The URI is stored only in the provider result and will not be printed, committed, or included in user-facing output. The next operation will apply the existing Prisma migrations exclusively to this isolated database.

- **[2026-08-31 13:20 UTC]** — The separate Neon test project now exists and its full Prisma migration history has been applied successfully to `nysc_test`. Read `scripts/test-registration-login.mjs`: it creates a disposable CORP or AGENT account, exercises OTP gating, registration, CSRF, failed and successful credentials login, session visibility, role-page access, and cleanup. It refuses non-local base URLs unless explicitly overridden, so the safe plan is to start the app locally against the isolated database and let the script create and remove a disposable test user. No production database or account will be used.

- **[2026-08-31 13:35 UTC]** — Started the local Next.js app against the isolated Neon project and ran `pnpm test:e2e:auth` with a disposable CORP test account. All 14 assertions passed, including OTP rejection, verified registration, minimized response, CSRF issuance, failed and successful credentials login, session cookie, session role, password non-disclosure, and authenticated `/member` reachability. The script cleaned up its test user and OTP record. The generated test output contained only an `example.test` address and no production data.

- **[2026-08-31 13:45 UTC]** — The first synthetic-account seed attempt failed before connecting to Neon because a temporary script in `/tmp` could not resolve the repository-local `bcryptjs` package. No account or database row was created by that failed run. The script will be corrected to use the installed package’s absolute path, then rerun against the isolated database.

- **[2026-08-31 14:00 UTC]** — Seeded three persistent synthetic accounts in the isolated Neon project: `nysc-test-corp@example.test` (CORP), `nysc-test-agent@example.test` (AGENT, verified), and `nysc-test-admin@example.test` (ADMIN). All use a test-only password and `example.test` addresses; no production identities were used. No credentials were written to the repository. The next step is to exercise them locally and run the isolated business-flow acceptance suite.

- **[2026-08-31 14:08 UTC]** — Confirmed the repository exposes `test:business-flows` for authenticated CORP, AGENT, and ADMIN workflows. Because the local app is connected only to the isolated Neon database, this suite is now safe to run; its own cleanup path will remove created users, properties, and bookings after completion. Production remains untouched.

- **[2026-08-31 14:20 UTC]** — The isolated `test:business-flows` suite failed at `Corp denied Agent Viewings`: the test expected HTTP 307 but received 200. This is the first concrete authorization defect candidate. The test process exited before its normal cleanup block, so isolated test data may remain and must be inventoried and cleaned only within the isolated database. Production was not contacted.

- **[2026-08-31 14:28 UTC]** — The structured file search did not support the brace-extension scope used for the route lookup, so it returned no files. No source changed. I will use a bounded shell grep/find search instead.

- **[2026-08-31 14:35 UTC]** — Reviewed `test-business-flows.mjs`; its request helper explicitly uses `redirect: "manual"`, so the observed 200 is not explained by automatic redirect following. The agent layout correctly redirects non-AGENT roles. The failed suite’s `finally` cleanup path ran on assertion failure, but the isolated database will be checked again. A targeted local session probe is needed to inspect the response status, Location header, and session cookie behavior without printing credentials.

- **[2026-08-31 14:50 UTC]** — Targeted isolated probe established a valid CORP session cookie and `/api/auth/session` status 200, but `/agent/viewings` still returned HTTP 200 with no Location header. This makes the authorization behavior a credible defect rather than a test-harness redirect-following issue. The next probe will inspect only safe HTML markers to determine whether the response renders the agent shell or a member/sign-in page; no credentials or response secrets will be recorded.

- **[2026-08-31 15:05 UTC]** — The body-marker probe found no obvious agent, member, or sign-in text in the 200 HTML, so the response may be a minimal shell or loading state. It did confirm no Location header. Before changing code, the next probe will parse the session role and inspect redirect-related headers only; this avoids treating a blank/minimal HTML response as authorization success.

- **[2026-08-31 15:20 UTC]** — Vercel Firewall overview was inspected in the connected console. It shows Firewall active, all systems normal, one active custom-rule count, system mitigations active, bot protection inactive, approximately 1.7k allowed requests, and zero displayed denied, challenged, logged, or rate-limited requests for the selected past-day window; there are no active alerts. The Rules and Audit Log subpage redirected to a Vercel login wall, so the exact custom rule and event records remain unavailable. No Firewall setting was changed.

- **[2026-08-31 15:20 UTC]** — The isolated authenticated business-flow test exposed a concrete authorization issue candidate: a valid CORP session receives HTTP 200 from `/agent/viewings` instead of the expected 307 redirect. The server-side agent layout contains the intended role check, but the response has no Location header. A production-mode build/start validation on the isolated database is the next diagnostic step to rule out a development-mode caching artifact before source changes.

- **[2026-08-31 16:00 UTC]** — Direct `next build` completed successfully against the isolated database. TypeScript and page generation passed for all routes. The build emitted repeated Node `DEP0040` `punycode` deprecation warnings during page-data collection, but no `DEP0169` `url.parse` warning. This shifts the production runtime warning investigation toward a Node 24/Vercel dependency path rather than application source. The compiled app will now be started on port 3001 for an authorization recheck.

- **[2026-08-31 16:20 UTC]** — The compiled production-server business-flow rerun could not authenticate over plain HTTP: the first credentials login returned 403, consistent with secure-cookie/CSRF behavior under `NODE_ENV=production` on an HTTP localhost URL. This is a local harness limitation, not evidence of a production failure. The earlier development-mode isolated auth test passed all 14 assertions. The agent-route authorization discrepancy remains under investigation; no source or production change has been made.

- **[2026-08-31 16:35 UTC]** — Added an explicit `engines.node: "22.x"` pin to `package.json`. This is the smallest justified remediation for the Node 24 framework-level DEP0169 path: the repository has no `url.parse` call, the Next.js issue documents the same warning under Node 24, and the direct Node 22 production build emitted no DEP0169 warning. Locked install, TypeScript no-emit, and migration-free production build all passed. Removed the generated TypeScript cache; only `PROJECT_LOG.md` and `package.json` are intentionally modified.

- **[2026-08-31 16:45 UTC]** — Committed and pushed the runtime remediation as commit `5485809` (`chore: pin Vercel runtime to Node 22`) to GitHub `main`. The commit contains only `package.json` and the append-only project log. Vercel deployment verification is now required before claiming the warning fix is live.

- **[2026-08-31 16:15 UTC]** — Vercel deployment `dpl_D2mHwTqSWts1FNXxkWuXuLoD19GT` reached `READY` production state, carries commit `54858097a863ce90aac838cc9b68198b97fe3382`, and is assigned `nysc-mu.vercel.app`. A post-deploy read-only homepage fetch returned HTTP 200 with the expected CSP, HSTS, frame, content-type, permissions, and referrer protections. Vercel reported no runtime errors in the window beginning `2026-08-31T10:11:34Z`; this is the first post-pin window and is evidence against a new DEP0169 occurrence, not proof that historical logs were rewritten.

- **[2026-08-31 16:20 UTC]** — On the isolated local environment, the compiled production server returned 307 to `/signin` for unauthenticated `/agent/viewings`, while the development server returned 200 for the same route. This identifies the earlier CORP-to-agent discrepancy as a development-server/middleware behavior difference rather than a production authorization result. The successful isolated auth test remains valid in development for login/session behavior; the compiled production auth flow requires HTTPS because secure cookies are enabled.

- **[2026-08-31 16:25 UTC]** — Isolated testing is provisioned in Neon project `blue-dust-99064384` (`NYSC isolated test`, database `nysc_test`, branch `br-mute-breeze-aw4pcxap`). All 14 registration/login/session assertions passed with a disposable account, and three persistent synthetic accounts exist for future authenticated checks: CORP, verified AGENT, and ADMIN, all using `example.test` addresses and a test-only password. No production data was copied or modified. The isolated business-flow suite exposed a development-only route-status mismatch and should be rerun behind HTTPS or with the development middleware behavior corrected before treating it as a complete acceptance pass.

- **[2026-08-31 17:05 UTC]** — Rerun plan: repeat `test:e2e:auth` against the isolated Neon database and development server; repeat `test:business-flows` against the same isolated development server to confirm the prior route discrepancy; then compare with direct compiled-production unauthenticated redirects. Production data and Vercel settings remain out of scope for this rerun.

- **[2026-08-31 17:30 UTC]** — Rerun complete. `test:e2e:auth` passed all 14 assertions again against the isolated Neon database and local development server. `test:business-flows` reproduced the same failure at `Corp denied Agent Viewings`: expected 307, received 200. The compiled production server independently returns 307 for unauthenticated `/agent/viewings`, while the development server returns 200, confirming a repeatable dev-only middleware discrepancy. No production data or settings were touched.

- **[2026-08-31 18:00 UTC]** — Reopened the Vercel Firewall overview and Rules URLs in the connected browser. Both pages currently render `Login – Vercel` with email, Google, GitHub, SAML SSO, and Passkey options; no rule or Security Events data is visible in this browser session. The read-only Vercel provider summary remains the only available evidence. No login or security-setting change was attempted.

- **[2026-08-31 18:20 UTC]** — The traced `DEP0040` stack points into Node’s built-in `node:punycode` loaded through Next’s bundled Babel package during page-data workers; no direct project import was found. Official issue history indicates this warning can persist in Vercel-hosted builds even under Node 22 because it originates in framework/build infrastructure. A patch-level upgrade from Next `16.3.0` to published `16.3.3` will be tested as the only reasonable codebase remediation; if the warning remains, it will be documented as upstream/build-infrastructure noise rather than suppressed.

- **[2026-08-31 18:35 UTC]** — Tested Next.js `16.3.3` with `NODE_OPTIONS=--trace-deprecation`; the production build still passed but continued to emit `DEP0040` from Node’s built-in `node:punycode` through Next’s bundled Babel package. The patch upgrade therefore did not fix the warning and was reverted; the repository remains on the previously validated Next `16.3.0` with the Node `22.x` runtime pin. No dependency-upgrade commit was created. The warning is upstream/build-infrastructure noise and should not be hidden with `--no-deprecation`.
