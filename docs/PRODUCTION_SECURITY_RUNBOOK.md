# Production Security Runbook

## Scope and prerequisites

Use this runbook only with an authorized Vercel project owner and Resend account administrator. Do not paste secret values into GitHub issues, pull requests, chat, screenshots, shell history, or browser URLs. Keep a maintenance window available because changing `NEXTAUTH_SECRET` invalidates existing NextAuth JWT sessions after the new deployment is live.

Before changing production, record the Vercel project name, the production domain, the current deployment ID, and the date/time of the change. Confirm that the application has a working isolated staging environment and that the current branch passes `pnpm audit`, TypeScript, build, authentication E2E, authorization isolation, business-flow, and protected-route tests.

## Vercel Firewall and Bot Management

1. Sign in to the Vercel Dashboard with a project-owner or security-admin account and open the `nysc` project.

2. Select **Firewall** from the project navigation. If Firewall or Bot Management is unavailable, record the team plan limitation and do not substitute deployment password protection for WAF rules. Ask the Vercel team owner to enable the supported security product or use an authorized Vercel security API.

3. Enable the managed WAF/OWASP ruleset in blocking mode for production after reviewing its detection logs. Keep the managed rules enabled for SQL injection, XSS, remote/local file inclusion, remote code execution, path traversal, protocol anomalies, and known exploit signatures.

4. Add a custom rule named `auth-aggregate-ip-rate-limit` with a condition matching `POST` requests under `/api/auth/` and an aggregation key of source IP. Set the threshold to **60 requests per 15 minutes**. Start with **Challenge** if the product has not observed the rule in monitor mode; use **Deny** for confirmed abuse.

5. Add a stricter rule named `auth-credential-reset-ip-rate-limit` matching `POST` requests to `/api/auth/callback/credentials`, `/api/auth/register`, and the password-reset endpoints. Set the threshold to **20 requests per 15 minutes per source IP**, with Challenge followed by Deny for continued abuse.

6. Add `upload-abuse-rate-limit` matching `POST /api/upload`, aggregated by source IP and, where the product supports it, authenticated user ID. Use **20 requests per 15 minutes** for authenticated traffic and a lower threshold of **5 requests per 15 minutes** for untrusted/pre-registration traffic.

7. Add `bot-auth-challenge` for automated-bot classifications on `/api/auth/*`, `/api/upload`, and `/api/nearby-essentials`. Use **Challenge** for suspected automation and **Deny** for confirmed malicious bots. Do not broadly block all search crawlers from public listing pages unless business owners approve the impact.

8. Add `high-value-route-bot-challenge` for `/member/marketplace`, `/agent/*`, `/admin/*`, `/api/pusher/auth`, and private document routes. Challenge anomalous automation, high request velocity, and reconnaissance patterns. Keep explicit allowlists narrow and limited to monitored deployment or trusted operations IPs.

9. Add `suspicious-host-proxy-deny` for sensitive API paths when the Host header is not an approved production domain or when proxy-forwarding headers conflict with the trusted edge context. Deny rather than redirect these requests.

10. Do not create bypass rules for `/api/internal`, `/api/admin`, or private documents unless there is a documented trusted network and a separate authentication control. A WAF bypass is not an authorization mechanism.

11. Save the rules, deploy them to the production environment, and confirm that the rule status is active. If Vercel supports dry-run/monitor mode, observe at least one normal traffic window before switching from Challenge to Deny.

12. Verify with controlled requests from a non-production client: normal authentication succeeds, repeated authentication eventually receives 429/Challenge, oversized uploads are blocked, suspected bot requests are challenged, and Admin/private routes remain protected. Review Firewall logs for false positives, blocked counts, source distribution, and affected paths.

The application already includes server-side rate limiting and authorization. Vercel rules are defense in depth and must not be used as a replacement for session checks, ownership predicates, CSRF controls, or role enforcement.

## Resend API key revocation and replacement

1. Sign in to the Resend Dashboard at `https://resend.com` using an authorized owner or API-key administrator account.

2. Open **API Keys** and locate the historical key associated with the previously committed `.env.local`. Treat it as compromised even if it is not currently active in the deployment.

3. Revoke or delete that historical key immediately. Record only the key name, last-four identifier if the dashboard provides one, revocation timestamp, and operator; never record the key value.

4. Create a replacement key with the minimum scope required by the application: sending transactional email from the verified sender/domain. Do not grant contact-management, broadcast, webhook, or account-administration scopes unless the application requires them.

5. Update the Vercel project environment variable used by the application. This repository supports `BREVO_API_KEY`/`BREVO_SMTP_KEY` for its current email provider configuration; if the production deployment still uses `RESEND_API_KEY`, update that exact variable only after confirming the runtime email adapter. Set the replacement for **Production** and **Preview** as appropriate, not Development unless needed.

6. Redeploy production. Trigger a safe password-reset or OTP email to a controlled test mailbox and confirm delivery. Review Resend logs for successful delivery from the replacement key.

7. Verify invalidation by making a harmless authenticated API request with the revoked key, if Resend provides a test endpoint or CLI/API check. The expected result is HTTP 401/403 or an equivalent invalid-key response. Do not test by sending to an uncontrolled recipient.

8. Search the current repository, built client assets, deployment logs, and CI logs again. Confirm that only the replacement is present in the provider secret store and that no key value appears in source or build output.

## NextAuth secret rotation

1. Generate a new cryptographically random secret locally or through an approved secret manager. Do not use a human phrase or reuse the historical value. Keep the value out of shell history and Git.

2. In Vercel Dashboard, open **Project → Settings → Environment Variables** for `nysc`. Edit `NEXTAUTH_SECRET` for **Production**, replace it with the new secret, and update **Preview** as well if previews share authentication infrastructure. Keep Development separate.

3. Confirm `NEXTAUTH_URL` points to the correct production domain and that the new secret is available to the deployment before promoting it.

4. Deploy the change. Existing JWT sessions signed with the historical secret should no longer authenticate after the new deployment is serving traffic. Expect users to sign in again.

5. Verify invalidation with a controlled old-session cookie or a token generated before rotation: request `/api/auth/session` and confirm no authenticated user is returned. Then sign in with a controlled test account and confirm a new session works.

6. Review Vercel runtime logs for authentication errors, confirm the protected-route redirects are correct, and verify that Admin, Agent, and Corp users can establish new sessions with their expected roles.

7. Rotate any other signing or reset-token secret that shared the exposed value. Revoke old deployment tokens or CI secrets if they were stored in the historical file.

8. Do not force-rewrite Git history as the first response. Preserve evidence for incident review, keep the current tree free of secret values, and use history rewriting only after an explicit repository-owner decision and a coordinated force-push plan.

## Completion record

Record the operator, UTC timestamps, Vercel deployment ID, WAF rule names and thresholds, Resend key identifier without the secret, NextAuth rotation timestamp, old-session rejection result, replacement-email result, and any false-positive adjustments. Store the record in the approved incident/change-management system rather than in the public repository.
