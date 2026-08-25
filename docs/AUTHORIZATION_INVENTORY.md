# Authorization Inventory

This inventory covers the App Router API routes and exported server actions in the repository. Identity and privilege decisions are made from the server session or cron secret; client-provided IDs are treated only as record selectors and are checked against trusted ownership predicates.

## API routes

| Route | Exposure | Server control |
|---|---|---|
| `/api/health` | Public operational read | Returns health status only; no user data. |
| `/api/nearby-essentials` | Public read | Returns external nearby-place data; no account records. |
| `/api/auth/[...nextauth]` | Public authentication protocol | NextAuth CSRF, credential throttling, account lockout, trusted DB role/session claims. |
| `/api/auth/register` | Public registration | Same-origin, request-size, IP/email rate limits, OTP verification, server-controlled privilege defaults, generic conflict response. |
| `/api/upload` | Authenticated or OTP-gated pre-registration | Same-origin, request-size, file type/signature allowlist, ownership/session or verified-OTP gate, private storage. |
| `/api/admin/verification-document` | Admin-only | Requires an Admin session; validates the target user and private storage key. |
| `/api/pusher/auth` | Authenticated | Requires a session; non-admins may authorize only their own private channel. |
| `/api/contact/whatsapp` | Corp-only | Requires a Corp session and returns contact data only for a published property. |
| `/api/cron/cleanup-otp` | Cron-secret-only | Requires the configured cron bearer secret before deleting expired OTP records. |
| `/api/cron/deliver-notifications` | Cron-secret-only | Requires the configured cron bearer secret before processing pending notifications. |
| `/api/keep-alive` | Cron-secret-only | Requires the configured cron bearer secret before database access. |
| `/api/auth/_log` | Development logging stub | Returns a fixed acknowledgement and stores no records. |

## Server actions

| Module | Public operations | Authenticated and object-scoped operations | Privileged operations |
|---|---|---|---|
| `auth.ts`, `otp.ts` | Reset/OTP entry points | Token- or OTP-bound; rate-limited, generic responses, and reset-session invalidation. | None. |
| `member.ts` | Published property reviews may be public | Profile, bookings, saved properties, reviews, and property events are bound to the session user or a published property. | None. |
| `messages.ts` | None | Conversations and message reads/updates are constrained to the authenticated participant. | None. |
| `notifications.ts` | None | Reads and updates include `userId: sessionUser.id`. | None. |
| `booking.ts` | None | Corp booking creation uses the session member; Agent booking reads and status changes use the session Agent/property relationship. | Admin status operations are role-gated. |
| `viewing.ts` | None | Member reads/cancels use the session member; Agent reads/updates use the property-agent relationship; Admin updates are role-gated. | Admin status operations are role-gated. |
| `property.ts` | Published listings and public property views | Agent listing reads/writes use the session Agent; update/delete/boost require owner or Admin; property-view analytics derive viewer identity from the session. | Admin may moderate owned resources where explicitly permitted. |
| `report.ts` | None | Corp reports bind `reporterId` to the session; Admin report reads/updates are role-gated. | Admin-only moderation. |
| `dispute.ts` | None | Corp disputes require a booking owned by the session member. | Admin-only dispute review/respond. |
| `premium.ts` | None | Premium searches, artisan reviews, leads, and Agent analytics use trusted session identity and owner predicates. | Artisan-review moderation is Admin-only. |
| `agent.ts` | None | Agent dashboards, bookings, earnings, reviews, verification, and analytics scope through the session Agent/property relationship. | Admin may perform explicitly supported moderation actions. |
| `admin.ts`, `admin-profile.ts`, `audit.ts`, `cms.ts` | Published CMS content where intended | No ordinary-user data access. | Every user, payout, verification, CMS, audit, artisan, report, and role/ban action requires `requireRole("ADMIN")`; profile/password changes operate on the authenticated Admin. |

## Data and storage boundaries

Prisma is used only from server modules and API handlers; no Supabase client, public database RPC, or client-side service-role access is present. Private verification documents are stored in `.private-uploads` locally or private Vercel Blob objects in production. Runtime database access should use a least-privilege role, while migrations use a separate migration role. The test suite proves unauthenticated and cross-account denial for private-document and private-channel access, and the static authorization checks cover server-action role and ownership guard usage.
