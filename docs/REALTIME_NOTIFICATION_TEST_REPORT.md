# Realtime Notification Test Report

**Application:** NYSC Booking / Neat & Affordable  
**Test date:** 16 August 2026  
**Scope:** Booking-status notification delivery through Prisma, Pusher private channels, and the client listener.

## Executive result

The rebuilt notification implementation passed TypeScript validation and the Next.js production build. The controlled degraded path also passed: with Pusher disabled, the local Pusher authorization route returned `503`, and the protected delivery-retry route rejected unauthenticated requests with `401`.

A true end-to-end booking-status simulation and browser delivery assertion could not be completed safely because the deployed Vercel environment currently reports Pusher as unconfigured. The live deployment also does not yet expose the newly added `/api/cron/deliver-notifications` route, indicating that the latest notification implementation has not been deployed to Vercel.

No production booking or real user's data was mutated during this test.

## Test results

| Check | Result | Evidence |
| --- | --- | --- |
| TypeScript validation | Passed | `pnpm exec tsc --noEmit` completed without errors |
| Production build | Passed | `pnpm exec next build` completed successfully |
| Local Pusher auth with Pusher disabled | Passed degraded behavior | `POST /api/pusher/auth` returned `503` |
| Local retry route without authorization | Passed security behavior | `GET /api/cron/deliver-notifications` returned `401` |
| Live Pusher auth probe | Blocked configuration | `POST https://nysc-mu.vercel.app/api/pusher/auth` returned `503` |
| Live retry route | Not deployed | `GET https://nysc-mu.vercel.app/api/cron/deliver-notifications` returned `404` |
| Booking status mutation | Not executed | No isolated test record and no configured realtime channel |
| Browser WebSocket delivery | Not verified | Production Pusher configuration is missing |

## Interpretation

The application correctly preserves the database-first design: Pusher is an optional delivery layer, and a missing Pusher configuration is handled as a controlled degraded state rather than a successful realtime claim. The `503` from the live authorization route means the client cannot establish a private Pusher subscription in the current production environment.

The live `404` for the retry route means the latest source changes still need to be deployed. The route exists in the local build and is registered in `vercel.json`, but a Vercel deployment containing these changes is required before production retry behavior can be tested.

## Required steps for a complete E2E pass

1. Configure `PUSHER_APP_ID`, `NEXT_PUBLIC_PUSHER_KEY`, `PUSHER_SECRET`, and `NEXT_PUBLIC_PUSHER_CLUSTER` in Vercel Production, without placing secret values in source control.
2. Apply the reviewed Prisma migration with `prisma migrate deploy` against the production database.
3. Deploy the notification implementation and verify that `/api/cron/deliver-notifications` no longer returns `404`.
4. Use an isolated Corp Member, Agent, property, and booking test record in staging or an explicitly approved production test account.
5. Open the Corp Member notification inbox, perform one authorized booking-status transition through the real server action, and verify one database notification row plus both `booking:status` and `notification:new` on the client.
6. Confirm the UI refreshes from the database and then clean up only the isolated test records.

## Security notes

The test did not print or store Pusher secrets, session cookies, database URLs, or bearer tokens. The retry endpoint requires a bearer secret, and the test did not attempt to bypass that boundary.
