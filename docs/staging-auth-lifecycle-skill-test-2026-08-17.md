# Staging Auth Lifecycle and Reusable Skill Test

**Date:** 2026-08-17
**Repository:** `akeemadetunji1234-wq/NYSC`
**Branch:** `staging/nysc-hardening-auth-e2e`
**Commit:** `c775d86` (`Add automated auth lifecycle test`)

## Reusable Skill

The reusable skill is stored at `/home/ubuntu/skills/nysc-production-hardening/SKILL.md`. It was extended with the disposable registration/login lifecycle procedure and staging-branch reusability guidance. The official skill validator returned `Skill is valid!` after the update.

## Automated Test Added

The staging branch adds `scripts/test-registration-login.mjs` and the `pnpm test:e2e:auth` package script. The test is designed for an isolated local or staging database. It refuses non-local URLs unless an explicit override is supplied, creates a short-lived bcrypt-hashed OTP fixture, checks registration rejection before OTP verification, checks registration after verification, verifies response minimization, exercises NextAuth CSRF and credentials login, validates the session cookie and `/api/auth/session`, checks the role-scoped route, rejects invalid credentials, and removes its test user and OTP in a `finally` block.

## Checks Performed

| Check | Result | Evidence |
| --- | --- | --- |
| Skill validation | PASS | `quick_validate.py nysc-production-hardening` returned `Skill is valid!` |
| Test-script syntax | PASS | `node --check scripts/test-registration-login.mjs` |
| Staging branch build | PASS | `pnpm exec next build`; all 58 pages generated and exit status 0 |
| GitHub staging branch | PASS | Branch pushed to `origin/staging/nysc-hardening-auth-e2e` |
| Full auth lifecycle | BLOCKED BY ENVIRONMENT | The configured local `DATABASE_URL` points to unavailable `localhost:5432`; the script stopped before creating a fixture and made no writes |

## Limitation and Next Action

The full registration/login lifecycle requires an isolated staging PostgreSQL database and a running staging application URL. It was intentionally not run against Production. Supply a staging `DATABASE_URL` and `BASE_URL`, or explicitly approve a disposable preview-environment run, before executing `pnpm test:e2e:auth` against a non-local target. No credentials, OTP values, database URLs, or secret environment-variable values are included in this report.
