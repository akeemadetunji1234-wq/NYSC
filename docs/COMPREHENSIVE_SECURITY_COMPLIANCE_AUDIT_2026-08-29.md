# Comprehensive Security and Compliance Audit — 2026-08-29

**Project:** Neat & Affordable / NYSC marketplace  
**Repository:** `akeemadetunji1234-wq/NYSC`  
**Reviewer:** Manus AI  
**Review style:** Direct, evidence-based, and intentionally skeptical.

## Executive verdict

The project is **materially more secure than a typical early-stage marketplace**, but it is **not ready for an unqualified public launch**. The application-layer work is strong. The operational and provider-layer work is incomplete. The previous habit of counting local tests as a “100% complete” result is too optimistic because several high-impact controls are outside the repository and remain unverified.

| Area | Honest rating | Verdict |
|---|---:|---|
| Application security engineering | **8/10** | Strong server-side authorization, session invalidation, upload validation, SSRF controls, CSP, CORS, and booking concurrency protections. |
| Reusable skill effectiveness | **7/10** | Useful and now better at finding candidate surfaces, but it is an audit framework, not a complete security scanner or proof of authorization. |
| Evidence quality | **7/10** | Good local tests and production read-only probes, but some historical reports overstate completeness and provider controls remain unverified. |
| Operational launch readiness | **5/10** | WAF analytics confirmation, credential rotation, Cloudinary preset hardening, Paystack approval/readiness, monitoring, and deployment of the latest changes remain unresolved. |
| Overall launch readiness today | **6/10** | Suitable for a controlled staging/agent-onboarding phase; not yet suitable for broad public marketing or real payment activation. |

**Direct conclusion:** If the launch decision is “go fully public today,” my answer is **no**. If the decision is “continue controlled Ibadan preparation with no real payment activation and limited trusted users,” my answer is **yes, with monitoring and rollback readiness**.

## 1. Reusable-skill effectiveness test

A deliberately vulnerable sample application was created outside the NYSC repository. It contained an unprotected server action, a user-controlled redirect, a server-side fetch of a user-controlled URL, a filesystem read from user input, a filename-controlled upload write, and dynamic module loading from an environment variable.

### Initial result

The first baseline script did **not** detect most of those weaknesses. It only searched a narrow dangerous-sink list and did not scan redirects, generic `fetch`, filesystem APIs, dynamic imports, or multipart upload handling. Worse, the script reported a successful overall process even when the sample had no TypeScript compiler available and the typecheck command failed.

That was a real defect in the reusable skill. The initial effectiveness rating was **4/10**.

### Corrective improvements

The skill and baseline script were tightened in two ways. First, the scanner now inventories redirect parameters, browser navigation, fetches, safe outbound wrappers, filesystem APIs, path operations, dynamic imports, `formData()`, and `File` usage. Second, dependency-audit, typecheck, and build exit statuses now affect the script’s final exit code.

The rerun found the vulnerable sample’s candidate lines, including:

| Detected sample surface | Result |
|---|---|
| `searchParams.get("next")` and `returnUrl` | Detected for manual review. |
| `fetch(remote)` | Detected for SSRF review. |
| `fs.readFile(file)` | Detected for path-confinement review. |
| `fs.writeFile(path.join(..., filename))` | Detected for upload/path review. |
| `request.formData()` | Detected for upload review. |
| `import(process.env.PROVIDER_MODULE ...)` | Detected for dynamic-module review. |
| Missing compiler in sample | Correctly caused a non-zero audit exit after the script fix. |

The corrected effectiveness rating is **7/10**, not 10/10. The script finds likely surfaces; it does not understand data flow, prove authorization, inspect provider dashboards, execute negative tests automatically, or determine whether a match is safe. A clean result from this script must never be treated as proof that a web application is secure.

## 2. Critical review of hardening guidelines

### Controls that are appropriately strict

The following guidance is correct and should remain strict: derive identity from the authenticated server session; apply ownership predicates inside database queries; deny unauthenticated and cross-account requests; use Secure/HttpOnly/SameSite cookies; keep session tokens out of URLs and logs; use exact redirect allowlists; block private and link-local SSRF destinations; revalidate redirects; canonicalize local paths; generate server-side filenames; inspect file signatures; cap sizes and counts; and use `frame-ancestors 'none'` when no embedding requirement exists.

### Rules that can be overly restrictive if applied without context

| Rule | Risk of over-restriction | Correct application |
|---|---|---|
| `style-src` must have no `unsafe-inline` | Some frameworks, third-party maps, or legitimate style attributes may break. | Remove inline styles first; use nonces/classes. If an unavoidable style attribute exists, isolate and document it rather than broadening all script policy. |
| `frame-ancestors 'none'` everywhere | Breaks legitimate partner/admin embedding if the business later requires it. | Correct for this marketplace because no embedding use case is currently documented. Reassess before introducing embedded widgets. |
| Only exact internal callback paths | Can block a legitimate future partner or payment return flow. | Use exact scheme/host/path allowlists for explicitly approved external destinations; never use arbitrary hosts or prefix-only host checks. |
| All outbound fetches must use an exact allowlist | Appropriate for provider integrations, but can make legitimate integrations fail until deliberately registered. | Keep the failure closed and add providers one at a time with explicit host, timeout, redirect, and response-size policy. |
| Reject all uploads without malware scanning | A blanket scanner requirement may be disproportionate for small, constrained image uploads. | Current image-only controls are reasonable; add malware scanning before accepting PDFs, documents, archives, or broad user files. |
| Temporary account lockout after five failures | Attackers can abuse lockouts for denial of service. | Keep lockouts short, combine account/IP/device limits, use generic errors, and monitor sustained attacks. |

### Gaps in the guidelines

The guidance still needs more explicit acceptance criteria for authorization coverage, webhook signature verification, replay protection, secret rotation proof, database backup/restore, dependency exception ownership, alert delivery testing, incident response, and privacy/retention. It also needs a distinction between **static inventory findings**, **unit-test proof**, **integration-test proof**, **production read-only observation**, and **provider-dashboard confirmation**.

The skill should not imply that a CSP header automatically proves nonce correctness. It must verify nonce freshness across responses, script execution behavior, and required third-party flows. Similarly, `checks: ["pkce", "state"]` in NextAuth is strong evidence of intended provider configuration, but it is not a substitute for negative callback tests and a verified provider flow.

## 3. NYSC project-wide findings

### Verified strengths

The central audit records server-controlled email verification and opaque Google onboarding state, seven-day sessions, session-version invalidation after sensitive events, generic password-reset behavior, credential abuse controls, same-origin-by-default CORS, SSRF-safe provider calls, Cloudinary image validation, PostgreSQL booking concurrency locks, role/ownership guards, admin denial tests, and production header/CORS probes. The latest local work additionally tightened CSP style policy, shared redirect validation, Cloudinary server-side naming, and private-document storage-key confinement.

The corrected baseline audit against NYSC exited successfully with zero reported package advisories and a passing TypeScript check. The latest focused regression tests for headers, redirects, SSRF, storage keys, and path confinement passed.

### Unverified or incomplete controls

| Control | Current state | Honest interpretation |
|---|---|---|
| Vercel WAF `/api/auth/*` challenge | Rule was previously published, but the 65-request probes saw no challenge. | **Inconclusive**, not verified. Review Firewall rule scope/action/events in the dashboard. |
| Vercel Bot Management | Plan/access limitation previously observed. | **Pending provider confirmation**; do not claim bot protection is deployed. |
| Historical credential rotation | Deferred at owner request. | **Not done**. Source cleanup or successful tests do not invalidate exposed credentials. |
| Cloudinary unsigned preset | Still client-facing at provider level. | Better than direct browser upload, but weaker than a signed server-controlled configuration. |
| Paystack live readiness | Approval and test-mode webhook/reconciliation work remain. | Do not enable real premium activation yet. |
| Malware scanning | Not installed. | Acceptable only while uploads remain constrained; residual risk for future document expansion. |
| Latest code deployment | This pass changed local repository files only. | The changes are not production until pushed and deployed successfully. |
| Full regression matrix after latest changes | Focused tests passed; all historical full-suite claims predate some latest edits. | Rerun the relevant isolated full suite before merging/deploying. |
| Working tree cleanliness | Existing unrelated modified/untracked files remain. | Release provenance is currently ambiguous; clean release commit is required. |
| Continuous alerting | Runbook exists; provider and collector alert delivery are not proven here. | Documentation is not monitoring. Send test alerts and verify receipt. |

**Direct correction to prior optimism:** The project is not “fully hardened” merely because local tests passed. It is **application-hardened with operational gaps**.

## 4. Audit compliance checklist

Use the following checklist as the evidence register for the upcoming audit. Mark a control **Pass** only when the acceptance evidence exists; mark **Partial** when code exists but provider or runtime evidence is missing; mark **Fail** when the control is absent; mark **N/A** only with a written justification.

### Governance and evidence

| ID | Control | Evidence required | Status |
|---|---|---|---|
| GOV-01 | Scope, owner, environment, and review date are recorded. | Signed audit cover sheet. | ☐ |
| GOV-02 | Production, staging, and test environments are separated. | Environment map and deployment settings. | ☐ |
| GOV-03 | Security findings have severity, owner, due date, and residual-risk decision. | Risk register. | ☐ |
| GOV-04 | Release commit is clean and traceable to deployed Vercel deployment. | Git SHA and Vercel READY deployment. | ☐ |
| GOV-05 | Production write tests use no real customer data or funds. | Test run logs and fixture policy. | ☐ |

### Authentication, OAuth, and sessions

| ID | Control | Evidence required | Status |
|---|---|---|---|
| AUTH-01 | All private routes fail closed without a valid session. | Route inventory and unauthenticated tests. | ☐ |
| AUTH-02 | Ownership and role checks use trusted server identity. | Code review plus two-account negative tests. | ☐ |
| AUTH-03 | Role/privilege fields cannot be client-promoted. | Mutation tests and admin workflow review. | ☐ |
| AUTH-04 | Password reset tokens are random, hashed, short-lived, single-use, and non-enumerating. | Code evidence and token-reuse tests. | ☐ |
| AUTH-05 | Email verification is server-controlled, bound, expiring, and single-use. | Schema/code evidence and tamper/reuse tests. | ☐ |
| AUTH-06 | Session cookies are Secure, HttpOnly, appropriately SameSite, host-only, and narrowly scoped. | HTTPS response-header evidence. | ☐ |
| AUTH-07 | Password/security changes invalidate or revalidate prior sessions. | Session-version/revocation test. | ☐ |
| AUTH-08 | OAuth state is random, session-bound, single-use, and expiring. | Modified/missing/replay/cross-session callback tests. | ☐ |
| AUTH-09 | OAuth PKCE uses S256 and rejects missing, wrong, reused, or downgraded verifiers. | Provider callback tests or maintained-library evidence plus negative tests. | ☐ |
| AUTH-10 | Redirect and callback destinations use exact allowlists. | Redirect inventory and bypass tests. | ☐ |
| AUTH-11 | Login/reset responses do not reveal account existence. | Existing/non-existing account comparison. | ☐ |
| AUTH-12 | Login abuse protection uses account and network/device signals without permanent attacker-triggerable locks. | Rate-limit tests, logs, and alert rule. | ☐ |

### CSP, framing, CORS, and edge controls

| ID | Control | Evidence required | Status |
|---|---|---|---|
| EDGE-01 | CSP explicitly defines required directives including default, script, style, image, connect, object, base, and frame ancestors. | Production header capture. | ☐ |
| EDGE-02 | CSP nonce is fresh per document and applied to required inline scripts/styles. | Two-response nonce comparison and browser execution test. | ☐ |
| EDGE-03 | `unsafe-eval` is absent and unnecessary third-party origins are removed. | Header assertion and origin inventory. | ☐ |
| EDGE-04 | Untrusted framing is blocked. | `frame-ancestors`/X-Frame-Options evidence and frame test. | ☐ |
| EDGE-05 | CORS never reflects arbitrary origins or combines wildcard origin with credentials. | Hostile-origin GET/OPTIONS tests. | ☐ |
| EDGE-06 | Vercel Firewall rule covers intended auth paths with Challenge/Deny action. | Dashboard rule screenshot/export and event correlation. | ☐ |
| EDGE-07 | Vercel alerts/webhooks/drains are configured and signature-verified. | Test event, receiver log, and signature verification evidence. | ☐ |
| EDGE-08 | Cloudflare WAF/Security Events/Notifications are configured at the actual plan level. | Dashboard configuration and test notification. | ☐ |

### SSRF, files, and uploads

| ID | Control | Evidence required | Status |
|---|---|---|---|
| FILE-01 | Every server-side fetch is inventoried and either uses the shared safe wrapper or has documented bounded maintenance controls. | Fetch inventory and code review. | ☐ |
| FILE-02 | Outbound URLs require HTTPS, allowed hosts, safe DNS resolution, bounded redirects, timeout, and response-size limits. | Unit tests and integration evidence. | ☐ |
| FILE-03 | Local file paths are canonicalized and confined to approved directories. | Path traversal tests. | ☐ |
| FILE-04 | Blob/storage keys use fixed prefixes and strict server-controlled naming. | Storage-key validator tests. | ☐ |
| FILE-05 | Dynamic file/module/template selection is fixed or strictly allowlisted. | Dynamic import/file-selection inventory. | ☐ |
| FILE-06 | Upload MIME type and actual content signature are checked. | Mismatch and invalid-signature tests. | ☐ |
| FILE-07 | Upload size, count, account, IP, and batch limits are enforced. | Boundary and abuse tests. | ☐ |
| FILE-08 | Uploads are stored outside executable paths with safe response headers. | Storage and download response evidence. | ☐ |
| FILE-09 | Cloudinary preset is constrained or replaced with signed server-controlled uploads. | Cloudinary preset settings and successful test upload. | ☐ |
| FILE-10 | Malware scanning decision is documented for each accepted file class. | Risk decision and provider/scanner evidence. | ☐ |

### Marketplace, payment, and operations

| ID | Control | Evidence required | Status |
|---|---|---|---|
| OPS-01 | Booking creation/rescheduling is concurrency-safe and idempotent. | Locking tests and duplicate-request test. | ☐ |
| OPS-02 | Admin activation/deactivation is role-protected and audited. | Admin negative test and audit-log evidence. | ☐ |
| OPS-03 | Paystack references are verified server-side and webhook signatures are checked. | Test-mode webhook/reconciliation logs. | ☐ |
| OPS-04 | Paystack activation is idempotent and mismatch/refund paths are tested. | Test-mode scenario matrix. | ☐ |
| OPS-05 | Email delivery status and failures are monitored. | Notification-center logs and test delivery. | ☐ |
| OPS-06 | Security events are redacted and retained for a documented period. | Event schema, retention setting, sample redacted records. | ☐ |
| OPS-07 | Continuous uptime/header/security checks send alerts to a monitored destination. | Test alert receipt and run history. | ☐ |
| OPS-08 | Backups and restoration have been tested for the production database. | Restore drill record. | ☐ |
| OPS-09 | Incident response contacts and escalation times are defined. | Incident runbook and contact verification. | ☐ |
| OPS-10 | Secrets are rotated when exposure is suspected and old credentials are proven invalid. | Provider revocation/rotation evidence; otherwise Partial. | ☐ |

## 5. Required next actions, in order

1. Create a clean release branch/commit containing only the intended hardening changes and the necessary documentation. Do not deploy the current ambiguous working tree.
2. Rerun the isolated authentication, authorization, business-flow, security-boundary, security-scope, header, password-change, and focused file/redirect/SSRF tests after the latest edits.
3. Deploy that exact commit to a non-production or protected Vercel environment and verify CSP browser behavior, maps, Google sign-in, Cloudinary image upload, document retrieval, and sign-out.
4. Review Vercel Firewall **Overview → Rules → Traffic → Events** for `/api/auth/*`. Record the rule expression, action, environment, time window, matched request paths, and event details. Keep the result Inconclusive if no event correlation exists.
5. Restrict the Cloudinary unsigned preset immediately or move to a signed server-side upload. Confirm that the generated public ID is accepted before production rollout.
6. Rotate the historically exposed credentials through the authenticated provider workflows. This item is not optional if those values were ever committed or exposed.
7. Complete Paystack test-mode webhook, signature, idempotency, reconciliation, mismatch, refund, and support procedures before live activation.
8. Configure Vercel and Cloudflare monitoring, send test alerts, verify delivery to a monitored inbox/channel, and document retention/redaction.
9. Perform a restore drill and write the incident-response contacts before public launch.
10. Only after those steps pass should public Ibadan marketing and real premium payments begin.

## 6. Final assessment

The project has solved many of the difficult engineering problems: authorization isolation, secure sessions, abuse controls, upload validation, SSRF defenses, booking concurrency, and security headers. The remaining risk is not that the team has done nothing; it is that the team may **mistake a strong codebase for a completed production security program**.

The correct status is **“application controls substantially implemented; provider, credential, payment, monitoring, and release-governance controls still pending.”**
