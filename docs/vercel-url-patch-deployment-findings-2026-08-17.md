# Vercel URL patch deployment findings — 2026-08-17

The production deployment for commit `99ad773` failed during dependency installation before the application build ran.

Vercel build log: https://vercel.com/akeemadetunji1234-wqs-projects/nysc/HWPPYcKumrfav3Rw33y6vnM72A7Q

Observed error:

`ERR_PNPM_LOCKFILE_CONFIG_MISMATCH: Cannot proceed with the frozen installation. The current "patchedDependencies" configuration doesn't match the value found in the lockfile.`

Vercel used pnpm 10.x while the local patch metadata was generated with pnpm 11.x. No application runtime failure was observed from this deployment; the build stopped during install. The corrective action is to regenerate the lockfile with the pnpm major version used by Vercel, then redeploy and verify the build.

The local Next.js compilation had already succeeded, and a local `/api/auth/providers` smoke test returned 200 with no `DEP0169` or `url.parse` warning after applying the OpenID client patch.

Sources:
- https://vercel.com/akeemadetunji1234-wqs-projects/nysc/HWPPYcKumrfav3Rw33y6vnM72A7Q
- https://vercel.com/docs/deployments/configure-a-build

## Corrected deployment

Commit `8d7f656` regenerated the lockfile with pnpm 10-compatible `patchedDependencies` metadata. Vercel deployment `dpl_PbxprpiukPUrSNHuXZSv2ABX5ymX` reached `READY` in Production. The build installed dependencies, completed TypeScript, generated all 58 pages, and deployed successfully.

The grouped runtime-error view still lists the historical `DEP0169` warning only on the older deployment `dpl_EfGqH3cbceiqdMTcvvTqJKMTAjdm`, last seen at 11:48:58. It also lists two older unrelated errors: the historical direct-messaging-disabled error and one old upload Content-Type error. No new runtime error group was attributed to the corrected deployment.

The deployment-scoped URL fetch was redirected by Vercel Authentication (`302` to `vercel.com/sso-api`), so that fetch could not independently inspect the page body. The authenticated browser session remains the appropriate live UI verification path.

The signup test reached the live OTP verification screen, the user supplied the six-digit code, and the verification was submitted. The browser extension timed out before a final post-submit UI state could be captured; the runtime error view showed no new signup or OTP failure group.

## Local validation

- `quick_validate.py nysc-production-hardening`: passed.
- `pnpm exec next build`: passed; 58 static pages generated.
- Local production `/api/auth/providers` smoke test with a temporary local secret: `200 OK`.
- Local deprecation scan after the patch: no `DEP0169`, `url.parse`, or other Node deprecation output.
- Full `pnpm build` could not run locally because the sandbox `.env` points Prisma at unavailable `localhost:5432`; this is an environment limitation, not a compilation failure.
