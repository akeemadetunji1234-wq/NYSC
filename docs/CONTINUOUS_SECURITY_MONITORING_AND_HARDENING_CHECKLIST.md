# Neat & Affordable: Security Monitoring and Remaining Hardening Runbook

**Author:** Manus AI  
**Scope:** Vercel production deployment, Cloudflare DNS/security perimeter, Next.js/NextAuth authentication, CSP, OAuth/OIDC, and safe read-only verification.

## 1. Vercel Firewall analytics: verify `/api/auth/*` coverage

Vercel’s project Firewall page consolidates traffic and events across the platform firewall, Web Application Firewall, and Bot Management. The Overview shows active rules, mitigations, alerts, rule-level traffic, events, and denied IPs; the Traffic view supports filtering by rule/action and grouping by request path, client IP, user agent, ASN, JA4, and country [1].

### Dashboard procedure

1. Open the **Vercel Dashboard**, select the correct team, and open the **Neat & Affordable project**.
2. Confirm the selected project is the production project and that the inspected deployment is the current production deployment, not a preview alias.
3. Open **Firewall** in the project sidebar and record the review timestamp, selected environment, and time zone.
4. In **Overview**, set the time window to **Live / 10 minutes** for an immediate check, then repeat with **Last 24 hours**. Record the traffic total, alerts, active rules, mitigations, and denied IP count.
5. Open **Rules** and locate the authentication rate-limit rule. Verify that its expression matches the intended path scope, especially `/api/auth/*`, and that the action is the intended **Challenge** or **Deny** action rather than merely Log/Allow.
6. Open **Traffic**, filter by the applicable rule, and then select the **Request Paths** grouping. Search for `/api/auth/providers`, `/api/auth/signin`, `/api/auth/callback/*`, `/api/auth/register`, `/api/auth/forgot-password`, or the project’s actual authentication paths. Record matched requests and actions.
7. Open **Events** or the event detail from Overview. Expand representative events and verify the path, timestamp, action, rule identifier/name, source signals, and deployment/project association. Do not export or retain cookies, authorization headers, IP addresses, or other personal data unless strictly needed for an incident.
8. If the rule is absent, has zero events, or shows only Log/Allow, inspect the rule scope, ordering, project association, environment, and deployment domain. Vercel evaluates DDoS mitigation, IP blocking, custom WAF rules, and managed rulesets in order [2].
9. Run only a small synthetic correlation probe from a non-production account or approved test source. Use a distinctive benign header or path query only if the rule supports it; do not generate high-volume traffic. Correlate the probe timestamp with Firewall events.
10. Record the result as **Confirmed**, **Not observed**, or **Inconclusive**. A lack of a challenge in a small probe is not proof that the rule is missing; analytics visibility, sampling, plan limits, caching, route selection, or rule scope may explain it.

### Evidence table to complete

| Field | Value |
|---|---|
| Project and production deployment |  |
| Rule name/ID |  |
| Expression |  |
| Action |  |
| Environment |  |
| Time window and timezone |  |
| Auth paths observed |  |
| Matched event count |  |
| Challenge/Deny evidence |  |
| Sampling or plan limitation |  |
| Reviewer and timestamp |  |

Vercel Firewall alerts can be configured through the Vercel app or a webhook. The documented DDoS attack alert is generated for attacks exceeding 100,000 requests over 10 minutes, so it is not a substitute for validating a lower-volume `/api/auth/*` custom rule [1].

## 2. Remaining hardening checklist

### CSP and nonce verification

| Priority | Implementation task | Acceptance test |
|---|---|---|
| P0 | Generate a fresh unpredictable nonce per full document response in the server-side request/render boundary using a cryptographically secure generator. | Two uncached HTML responses have different nonces; no fixed nonce appears in source. |
| P0 | Put the nonce in `script-src` and apply the same nonce to every intentionally inline script that must execute. | Required inline bootstrap scripts execute; an inline script without the nonce is blocked. |
| P0 | Keep `unsafe-eval` absent. Remove unnecessary `unsafe-inline`; use nonces/hashes rather than broad exceptions. | Automated header assertion rejects `unsafe-eval`; CSP report contains no unexpected blocked application script. |
| P0 | Define least-privilege `default-src`, `script-src`, `style-src`, `img-src`, `font-src`, `connect-src`, `frame-src`, `object-src 'none'`, `base-uri 'self'`, and `frame-ancestors 'none'` or an explicit business allowlist. | Header parser verifies each directive and rejects undeclared third-party origins. |
| P1 | Allow only required providers, such as Cloudinary, Paystack, Google OAuth, Resend-related browser endpoints if actually used, and approved map providers. | Production smoke tests cover sign-in, image display, map, and payment-test UI without CSP violations. |
| P1 | Add a CSP report collector that stores only redacted violation metadata, applies request-size limits, rate limits, and retention limits. | Synthetic violation reaches the collector; tokens, cookies, and full sensitive URLs are not stored. |
| P1 | Run Report-Only in a controlled pre-production phase if a major policy change is needed; enforce in production after reviewing violations. | No unexplained violations remain for a complete user journey before enforcement. |
| P2 | Add automated checks against production response headers and built HTML. | CI fails when nonce generation disappears, a fixed nonce is introduced, or prohibited directives return. |

### OAuth/OIDC state, redirect, and PKCE verification

| Priority | Implementation task | Acceptance test |
|---|---|---|
| P0 | Generate a cryptographically random `state` for every authorization attempt and bind it to the initiating browser session using a short-lived, Secure, HttpOnly, SameSite-compatible cookie or server-side transaction record. | Missing, altered, replayed, or cross-session state is rejected. |
| P0 | Consume state exactly once and expire it quickly. | Replaying the same callback fails; expired state fails. |
| P0 | Use exact registered callback URLs. Do not build callback destinations from `next`, `returnUrl`, `callback`, or arbitrary request input. | Host, scheme, path, encoded, protocol-relative, and subdomain variations are rejected unless explicitly allowlisted. |
| P0 | For public OAuth clients or providers requiring it, generate a high-entropy PKCE `code_verifier`, derive `code_challenge` with **S256**, store the verifier only in the bound transaction/session, and send the challenge in the authorization request. | A valid verifier succeeds; missing, modified, wrong, reused, or plain-method verifier fails. |
| P0 | Verify the authorization response through the maintained provider SDK/library, validate issuer, client ID, redirect URI, nonce where applicable, and token signature/claims. | Wrong issuer, audience, nonce, signature, algorithm, or expired token is rejected. |
| P1 | Keep provider errors generic to the browser while logging precise, redacted reason codes server-side. | Unknown account, invalid state, and provider errors do not reveal account existence or secrets. |
| P1 | Rotate/review sessions after account linking, email change, password change, role change, or other sensitive identity events. | Existing sessions are revoked or revalidated according to the documented policy. |
| P2 | Add negative tests for callback injection, state fixation, cross-account linking, redirect bypasses, and PKCE downgrade. | The security test suite proves denial without modifying production data. |

### Authentication and session follow-through

Confirm that login, registration, reset, invitation, email verification, and persistent-login paths use non-enumerating responses; rate limits combine account and network/device signals; reset and verification tokens are high-entropy, hashed where practical, short-lived, single-use, and invalidated on use; verified flags remain server-controlled; and authentication cookies remain Secure, HttpOnly, narrowly scoped, and SameSite-compatible. Add tests for token reuse, client-side verified-flag tampering, logout revocation, and session invalidation after password change.

## 3. Continuous monitoring architecture

Use a **two-layer design**. The first layer is provider-native alerts for events the providers can detect reliably. The second layer is a small, authenticated security collector or SIEM destination for application logs, synthetic checks, and cross-provider correlation.

| Signal | Source | Suggested cadence/trigger | Destination | Initial response |
|---|---|---|---|---|
| Vercel Firewall rule matches and mitigations | Vercel Firewall Overview/Traffic/Events | Daily review; incident review immediately | Security runbook; optional Slack/PagerDuty webhook | Confirm path, action, rule scope, and false positives. |
| Vercel attack detected | Vercel Firewall webhook | Immediate provider event | Signed webhook collector and on-call channel | Preserve redacted event, inspect deployment and origin behavior. |
| Vercel runtime/build errors | Vercel Logs or Drains | Near real time; alert on sustained 5xx/error-rate spike | SIEM/log platform | Correlate route, deployment, release, and trace ID. |
| Sensitive deployment/configuration changes | Vercel webhooks or audit-log drain where plan supports it | Every event | Signed collector/SIEM | Review actor, project, environment-variable changes, and rollback need. |
| Cloudflare WAF actions | Cloudflare Security Events | Daily review; threshold alerts where plan supports | Cloudflare Notifications/webhook | Filter `/api/auth/*`, admin, upload, and payment paths; investigate spikes. |
| Cloudflare all-request traffic | Cloudflare Security Analytics | Weekly baseline; incident deep dive | Dashboard or GraphQL export | Compare paths, countries, ASNs, user agents, and actions. |
| Cloudflare Logpush health | Cloudflare Logpush health analytics | Daily automated check | Notification email/webhook | Repair destination, credentials, DNS, or permissions before logs are lost. |
| Endpoint availability and headers | Synthetic monitor | Every 5–15 minutes, low volume | Incident channel | Check HTTPS, status, HSTS, CSP, CORS, cookies, and DNS. |
| Auth abuse and enumeration indicators | Application structured logs | Real time aggregation | SIEM/alert collector | Alert on sustained failures by account/IP/device without storing credentials. |

Vercel Drains can forward runtime/build/static logs, traces, Speed Insights, Web Analytics, and other observability data to an HTTPS custom endpoint or supported integrations; custom endpoints should verify `x-vercel-signature` and return HTTP 200 [3]. Vercel account webhooks support deployment, project, environment-variable, and firewall attack events, and webhook signatures should be checked [4].

Cloudflare Security Events is located at **Analytics → Events** for the zone. It shows security events actioned or flagged by Cloudflare, while Security Analytics is the appropriate view for all incoming traffic, including traffic not acted on [5]. Cloudflare notes that the Free plan has sampled logs and limited retention, so absence from sampled logs must not be treated as proof of absence [5].

Cloudflare Notifications can deliver available product alerts by email or webhook depending on the plan. Security-event alerts are spike-based rather than one notification per individual event [6]. For Logpush, Cloudflare documents a **Failing Logpush Job Disabled** alert and GraphQL health dataset; the notification can be delivered by email or webhook [7].

## 4. Safe implementation sequence

1. Create a redacted event schema and retention policy before enabling collection. Never store passwords, bearer tokens, session cookies, reset links, full authorization codes, or payment secrets.
2. Deploy an authenticated collector endpoint outside the application’s sensitive request paths, verify Vercel signatures, apply replay protection, enforce body-size and timeout limits, and return quickly with asynchronous processing.
3. Add structured application security events for authentication failures, state/PKCE failures, authorization denials, rate-limit decisions, upload rejections, webhook signature failures, and admin role changes.
4. Configure Vercel Firewall event review and the signed Attack Detected webhook if available to the current plan.
5. Configure a Vercel Log Drain for production runtime logs with path-sensitive sampling. Use 100% sampling during a controlled launch window, then reduce volume only after coverage is established [3].
6. Configure Cloudflare Notifications for supported security, incident, SSL/TLS, and Logpush events. Use email first, then add a signed webhook to the collector.
7. If Cloudflare Logpush is available on the plan, forward only the necessary fields to a restricted destination and monitor `logpushHealthAdaptiveGroups` for non-200 delivery statuses [7].
8. Build four low-volume synthetic checks: home page, sign-in page, health endpoint, and a harmless authentication metadata route. Assert status, CSP, HSTS, CORS rejection for an untrusted origin, and cookie attributes where applicable.
9. Run the checks from a scheduled CI job or external monitor using a dedicated non-production identity. Do not submit real credentials, trigger payments, create listings, upload real images, or target production write routes.
10. Define escalation: P1 for confirmed unauthorized access, secret exposure, payment/webhook compromise, or sustained auth attack; P2 for WAF rule mismatch, elevated 5xx, CSP regression, or failed log delivery; P3 for isolated false positives or noisy telemetry.
11. Review alerts weekly during the Ibadan launch and monthly after stabilization. Record rule changes, false positives, baseline metrics, and residual risks.

## 5. References

[1]: https://vercel.com/docs/vercel-firewall/firewall-observability "Vercel Firewall Observability"

[2]: https://vercel.com/docs/vercel-firewall "Vercel Firewall"

[3]: https://vercel.com/docs/drains/using-drains "Vercel Using Drains"

[4]: https://vercel.com/docs/webhooks "Vercel Setting Up Webhooks"

[5]: https://developers.cloudflare.com/waf/analytics/security-events/ "Cloudflare Security Events"

[6]: https://developers.cloudflare.com/notifications/notification-available/ "Cloudflare Available Notifications"

[7]: https://developers.cloudflare.com/logs/logpush/alerts-and-analytics/ "Cloudflare Logpush Alerts and Analytics"
