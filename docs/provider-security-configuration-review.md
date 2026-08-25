# Provider Security Configuration Review

Date: 2026-08-25

## Current Vercel state

The Vercel project is `nysc` with project ID `prj_fymt97azm7pNj1YBwVVTfsHlG7vb`, linked to GitHub repository `akeemadetunji1234-wq/NYSC`. The connected team reports the `hobby` plan. The latest production deployment for main was created from commit `27cf745` and reached `READY` in `iad1` under deployment `dpl_DbcsC9Q8nUvMTpBpWzuYyjwonSU6`. Production aliases include `nysc-mu.vercel.app` and `nysc-akeemadetunji1234-wqs-projects.vercel.app`.

The exposed Vercel connector provides deployment, project, deployment-protection, runtime-log, and documentation operations, but no read or mutation operation for Firewall/Bot Management rules. The effective deployment-protection query reported password protection disabled, Vercel Authentication enabled for all non-custom domains, and trusted IPs disabled. This is deployment protection, not WAF configuration.

## Official Vercel guidance captured

Vercel states that WAF custom rules can log, deny, challenge, bypass, redirect, or rate-limit traffic and take effect immediately after publication without a redeploy. The documented workflow is Project → Firewall → Configure → Add New Rule, initially use Log, observe live traffic, then change to Challenge, Deny, or Rate Limit and publish through Review Changes. Sources: https://vercel.com/docs/vercel-firewall and https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules.

Vercel’s rate-limiting documentation states that Fixed Window is available on all plans, counters are tracked per region, and the Hobby plan supports one WAF rate-limiting rule per project plus up to three total custom firewall rules. The rule requires a time window, request limit, source key, and follow-up action such as the default 429, Log, Deny, or Challenge. Source: https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting.

Vercel’s pricing documentation states that DDoS mitigation, IP blocking, and custom rules are free on all plans, while rate limiting and managed rulesets are plan-specific priced features. Source: https://vercel.com/docs/vercel-firewall/vercel-waf/usage-and-pricing.

## Recommended remaining WAF actions

The owner or authorized Vercel security administrator must open the nysc project’s Firewall page and verify feature availability on the Hobby plan. If rate limiting is available, configure one high-value aggregate rule, prioritizing POST authentication paths; use the repository runbook’s 60 requests per 15 minutes threshold only after confirming normal traffic volume, because Vercel counters are regional. Use the remaining custom-rule capacity for a strict credential/register/reset rule, bot challenge coverage, or upload abuse according to the team’s highest observed risk. Start new rules in Log mode, observe traffic, then publish Challenge or Deny actions. Review false positives and Firewall logs after publication.

The repository’s `docs/SECURITY_EDGE_CONTROLS.md` and `docs/PRODUCTION_SECURITY_RUNBOOK.md` contain the proposed route groups and thresholds. No WAF rule was claimed or changed because the connector does not expose Firewall configuration and no authenticated dashboard mutation was performed.

## Official Resend guidance captured

Resend treats API keys as secret tokens. The dashboard allows viewing, editing, and deleting keys, but the key value cannot be viewed again after creation. Resend recommends isolated keys, secure storage in environment variables, regular rotation, and deleting unused keys. Sources: https://resend.com/docs/dashboard/api-keys/introduction and https://resend.com/docs/knowledge-base/how-to-handle-api-keys.

Resend supports `full_access` and `sending_access`; `sending_access` can be restricted to a domain. The API can delete a key by ID and returns a deleted confirmation. Sources: https://resend.com/docs/api-reference/api-keys/create-api-key and https://resend.com/docs/api-reference/api-keys/delete-api-key.

## Remaining credential actions

An authorized Resend administrator must identify and delete the historical exposed key without recording its value, create a domain-scoped sending-only replacement, update the runtime provider variable in Vercel, deploy, send a controlled OTP/reset email, confirm delivery in Resend logs, and then verify the historical key is rejected. The repository’s current email adapter references `BREVO_API_KEY`/`BREVO_SMTP_KEY`; confirm the actual production adapter before changing a variable and do not blindly replace `RESEND_API_KEY` if it is not used by the deployed runtime.

An authorized Vercel project administrator must generate a new random `NEXTAUTH_SECRET`, replace the Production value and Preview value if shared, redeploy, verify old sessions no longer authenticate, verify new Corp/Agent/Admin sessions work, and record only timestamps and redacted identifiers. Current source and deployment metadata cannot prove provider-side environment values or invalidation; these remain pending dashboard actions.
