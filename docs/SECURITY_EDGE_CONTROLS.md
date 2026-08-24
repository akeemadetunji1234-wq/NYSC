# Security Edge Controls

This repository now enforces application-level protections for authentication and upload requests. The following controls must also be configured in the hosting provider because they run before the Next.js application receives a request.

## Vercel Firewall and Bot Management

Configure a custom firewall rule for `POST /api/auth/*` and the public authentication pages `/signin`, `/signup`, `/forgot-password`, and `/reset-password`:

- Apply a managed challenge or block when a single source IP exceeds 60 authentication requests in 15 minutes.
- Apply a stricter rule for `/api/auth/callback/credentials`, `/api/auth/register`, and password-reset actions when a source IP exceeds 20 requests in 15 minutes.
- Exclude trusted monitoring and deployment automation only by explicit IP allowlist; do not allowlist arbitrary client networks.
- Enable bot-management protection for `/api/auth/*`, `/api/upload`, `/api/nearby-essentials`, `/member/marketplace`, and other high-value routes exposed to scraping or reconnaissance.
- Log firewall actions and review challenge/block rates after rollout to avoid locking out legitimate users behind shared carrier NATs.

The application middleware independently applies an IP-based distributed rate limit when Upstash Redis is configured and a bounded local fallback otherwise. Provider-side rules remain necessary because they can reject abusive traffic before it consumes application compute.

## Database privileges

The application database role used by the deployment should be a dedicated runtime role with only the DML privileges required by the app. Prisma migrations must use a separate migration role. The runtime role must not have `SUPERUSER`, `CREATEDB`, `CREATEROLE`, replication, or unrestricted schema-management privileges. Rotate both roles independently and keep their connection strings in the hosting provider’s encrypted environment store.

## AI scope

No AI or prompt-processing endpoint is present in the current application. If AI functionality is added later, requests must be allowlisted server-side, prompt and tool inputs must be treated as untrusted data, usage must be capped per user and IP, request bodies must be size-limited, and tool permissions must not be derived from model output.

## Verification checklist

After configuring provider-side controls, verify that the following return a provider block or challenge before the request reaches the application: credential callbacks, registration, password reset, uploads, nearby search, and marketplace listing retrieval. Verify that legitimate sign-in and OTP flows remain functional from a normal residential connection and that all block decisions are visible in provider security logs.
