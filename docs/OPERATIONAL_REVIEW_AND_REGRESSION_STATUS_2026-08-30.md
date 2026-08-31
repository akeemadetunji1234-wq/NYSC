# Operational Review and Regression Status — 2026-08-30

## Executive status

The latest complete local regression run is **not fully green**. The application build, dependency audit, TypeScript checks, authentication E2E, authorization policy, password-change, business-flow, role-integration, and reusable security baseline checks passed. The responsive smoke test failed, and the first full run’s authentication/business failures were caused by the local test server being unavailable. After starting the server, those authentication/business failures were resolved except for the responsive smoke test.

| Check | Latest result | Interpretation |
|---|---:|---|
| Dependency audit | Pass | `pnpm audit` reported zero info/low/moderate/high/critical advisories. |
| TypeScript | Pass | `tsc --noEmit` passed. |
| Production build | Pass | `next build` passed; existing `punycode` dependency deprecation warning remains. |
| E2E authentication | Pass | Isolated local auth flow passed after server startup. |
| E2E authorization isolation | Pass | Two-account isolation flow passed after correcting the local origin configuration. |
| Authorization policy | Pass | Pure role/ownership policy checks passed. |
| Password change | Pass | Password update and session-revocation checks passed. |
| Business flows | Pass | Isolated marketplace/business flow passed after correcting the local origin configuration. |
| Responsive smoke | **Fail** | Headless browser did not find the auth surface on `/signup`; this is not yet proven to be a production UI defect. |
| Role integration smoke | Pass | Role boundary smoke passed. |
| Reusable security baseline | Pass | NYSC baseline audit exited 0. |
| Focused redirect/SSRF/file suite | Pass | Redirect, private-IP, storage-key, and path-confinement assertions passed. |
| CSP/header suite | Pass | Nonce, explicit directives, anti-framing, HSTS, no `unsafe-eval`, and no style `unsafe-inline` passed. |
| Reusable skill validation | Pass | Skill package validation passed. |

The full audit runner therefore returned **exit 1**, because one responsive check failed. A claim of “all tests pass” would be false.

## Cloudinary preset review

The repository and prior operational notes confirm that the current Cloudinary configuration uses a public environment-level upload preset rather than a fully signed server-side Cloudinary upload flow. The application proxy now performs authentication, active-agent checks, MIME/signature validation, size/count limits, abuse limits, server-generated filenames/public IDs, and response-origin validation. That is a meaningful improvement, but it does not eliminate provider-level exposure.

The Cloudinary console could not provide authenticated preset details in the current browser session; therefore the following settings remain **unverified**, not assumed safe:

| Cloudinary setting | Required state | Current evidence |
|---|---|---|
| Preset mode | Unsigned only if intentionally retained; signed server-side upload is preferred. | Repository documentation indicates unsigned; console confirmation unavailable. |
| Resource type | Image-only. | Application restricts image MIME/signatures; provider setting unverified. |
| Folder | Dedicated listing-image folder. | Application sends `listing-images/<random-id>`; provider setting unverified. |
| Filename/public ID | Overwrite disabled; client filename ignored. | Application now generates public IDs; preset configuration unverified. |
| Size/transformation limits | Restrict to required dimensions/size and avoid arbitrary transformations. | Provider setting unverified. |
| Format policy | JPG, PNG, WebP only. | Application enforces this; provider setting unverified. |

The next action is to inspect the preset while authenticated in Cloudinary and record a redacted settings checklist. Do not paste the API secret into the browser or repository. If the preset cannot guarantee the required restrictions, move to a signed server-side upload flow.

## Historical credential rotation review

Historical Git metadata contains repeated references to the key names `NEXTAUTH_SECRET`, `RESEND_API_KEY`, and the current email-provider key names. No rotation-related commit was found, and no provider-side revocation or replacement evidence is present in the repository. The owner previously deferred rotation.

Therefore, historical credential rotation status is **Not done / unverified**. The fact that current source files do not print secret values, or that the application builds and authenticates successfully, does not prove that an exposed historical credential is invalid.

Required evidence for Pass is provider-side revocation/rotation confirmation, updated encrypted Vercel environment variables, successful deployment using the replacement values, rejection or invalidation of the old credential, and review of dependent sessions/tokens. Until that evidence exists, mark the control **Partial or Fail**, depending on the auditor’s policy.

## Regression failure analysis

The first full run had three immediate local HTTP failures because no process was listening on `127.0.0.1:3000`. After starting the isolated server, E2E authentication passed. Authorization-isolation and business-flow callbacks initially returned 403 because `.env.test.local` used `BASE_URL=http://127.0.0.1:3000` while the application’s strict same-origin logic treated the canonical local server origin as `http://localhost:3000`. The test environment was corrected to use `http://localhost:3000`, and both suites passed.

The remaining responsive failure is:

```text
Auth light-mode regression: {"route":"/signup","href":"http://localhost:3000/signup","surfaceBackground":null,"inputBackground":null,"surfaceCard":null,"light":false}
```

The route returns server-rendered HTML containing `data-auth-surface` to curl, but the headless smoke test did not observe that surface after browser navigation. This indicates a browser-rendering, hydration, timing, CSP, or headless-environment issue; it is not enough evidence to declare the UI fixed. The test was made more robust by using `BASE_URL` and waiting for the surface, but it still fails. Investigate browser console/runtime errors and CSP violations before launch.

## Updated launch judgment

| Decision | Status |
|---|---|
| Continue controlled local/staging work | Yes. |
| Run isolated auth and business regression flows | Yes; latest relevant flows pass. |
| Claim complete regression success | No. The responsive check fails. |
| Launch broad public marketing | No, not yet. |
| Enable real Paystack premium activation | No. |
| Treat credential rotation as complete | No. |
| Treat Cloudinary preset hardening as verified | No. |

The correct current label is **application regression mostly passing, responsive verification blocked, Cloudinary provider settings unverified, and historical credential rotation outstanding**.
