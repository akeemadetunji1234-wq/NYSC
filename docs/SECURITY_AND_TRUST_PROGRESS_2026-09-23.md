# Security and trust progress — 23 September 2026

## Done in code (this session)

1. **Safety page** — Default safety guidance is always shown (verify first, money/deposits, communication, reporting). CMS items still override when published. Removed the temporary “updating this page” empty state.
2. **Admin support view** — Requires a support reason (min 8 chars) and optional ticket reference. Audit log records reason and ticket (`src/app/actions/supportSnapshot.ts`).
3. **Upload hardening** — JPEG/PNG dimension limits (max 8000px side, 40 megapixels) via `src/lib/imageDimensions.ts` and Cloudinary upload route.
4. **Web Push privacy** — Push payloads default to lock-screen-safe generic text (`src/lib/webPush.ts`).
5. **Admin monitoring** — Amber warning when Upstash distributed rate limiting is not configured.
6. **Homepage social proof** — `TestimonialsSection` component labels content as illustrative examples (wire into `App.tsx` if not already).

## Homepage stats

`getPublicMarketplaceStats()` already returns real DB counts (published listings, distinct states, CORP users, verified agents). Zeros mean empty data, not fake marketing numbers. Hero badge already switches to onboarding copy when listings are 0.

## Left for owner / next coding pass

| Item | Owner action |
|------|----------------|
| Upstash in production | Set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel (skipped this session by request) |
| Admin MFA + step-up | TOTP/WebAuthn enrollment, step-up for exports/role changes |
| Provider smoke tests | Real Pusher, Brevo inbox, Paystack test, device Web Push |
| Vercel WAF / Bot Management | Configure in Vercel Firewall UI |
| Legal pages final copy | Owner/legal review of Privacy, Terms, Safety |
| Emergency numbers | Only replace 112 fallbacks with authoritative state sources |
| Wire App.tsx to TestimonialsSection | Or keep inline section with ILLUSTRATIVE label |
| Product features | Saved-search alerts polish, dispute status UI, agent tier prominence, public guest browse verification |

## Deploy

Pushes landed on `main`. Confirm Vercel production deployment is READY after these commits.
