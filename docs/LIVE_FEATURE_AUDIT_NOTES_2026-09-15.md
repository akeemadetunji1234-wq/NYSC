# Live Feature Audit Notes — 15 September 2026

## Live deployment evidence

Production deployment `dpl_CJJG5FPQockaSQMeKZU8dQDB431L` for commit `441740d` is READY and aliased to `https://nysc-mu.vercel.app`. Vercel runtime errors currently include one historical viewing validation error from the older deployment `dpl_HfRgUVQeEe4Eg41hBYDwHoiYhLPc` at 09:23 UTC and one current Zod error on `/agent/bookings` (`Due date must be in the future`) observed at 10:02 UTC. No separate Pusher error group was returned.

Vercel logs showed successful authenticated requests to member routes and `POST /api/pusher/auth` with HTTP 200. The live notification cron route is protected by `CRON_SECRET` and delegates to `deliverPendingNotifications`.

## Neon evidence

Production Neon project: `old-dew-59146610`; primary branch: `br-silent-wind-at54tzfw`; database: `neondb`. Query logs are unavailable in this Neon region (`telemetry is not available in this region`), so database log verification is limited. The database has no long-running queries over five minutes and no held locks. `pg_stat_statements` is not installed, so slow-query statistics are unavailable.

Post-fix viewing records include one successful authenticated record created at `2026-09-15T09:36:00.072Z`, property `cmrozu1m2000btjdlofiezb5p`, date `2026-09-16`, time `10:00`, status `PENDING`.

## Code findings from user report

- Agent bookings `View details` buttons currently have no handler and are nonfunctional.
- Agent settings `Upload Logo` is a button only; no file input/upload/save behavior exists.
- New property form already uses `MapPicker`; edit property form does not load or render map coordinates.
- Safety check-in only stores `checkedInAt` and presents `I'm safe`; it has no explicit not-safe state or toggle. Public route returns `SAFE` or `ACTIVE`.
- Listing detail `Share` button has no handler and does not provide a link.
- Mobile comparison cards show limited fields and need full listing details.
- Google verification flow currently keeps the onboarding token in memory, strips it from the URL, and redirects to `/signin` when the state is missing. This is fragile across OAuth/browser redirects and is the reported OTP fallback issue.
- Agent mobile navigation places many links in a clustered drawer; logout is available at the top but should remain easily accessible without scrolling.

## External source URLs

- Production app: https://nysc-mu.vercel.app
- Vercel deployment alias: https://nysc-5ruclp1q5-akeemadetunji1234-wqs-projects.vercel.app
- Vercel deployment inspector: https://vercel.com/akeemadetunji1234-wqs-projects/nysc/CJJG5FPQockaSQMeKZU8dQDB431L

These notes are evidence gathered from live Vercel and Neon connectors, not fabricated provider results.
