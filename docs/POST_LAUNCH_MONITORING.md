# Post-Launch Monitoring Protocol: Neat & Affordable (First 24 Hours)

## Executive Overview

This protocol establishes a structured framework for the operational monitoring of the **Neat & Affordable** application during its critical first 24 hours of public deployment. By focusing on real-time telemetry, database integrity, and security boundaries, the maintenance team can ensure that the nationwide transport guide and property management systems operate within their validated parameters as user traffic scales.

---

## 1. Runtime Telemetry and Log Analysis

The Vercel Runtime Logs serve as the primary source of truth for application health. Monitoring efforts should focus on identifying unexpected server-side failures and validating the execution of high-load server actions.

| Monitoring Vector | Target Metric | Actionable Threshold |
| :--- | :--- | :--- |
| **Server Errors** | `HTTP 500` status codes | Any occurrence requires immediate investigation of the stack trace. |
| **Transport Guides** | `[TransportGuide]` log tag | Ensure all 37 jurisdictions are fetched without timeout or database connection errors. |
| **Middleware Activity** | `HTTP 307` redirects | Investigate if users are redirected to `/signin` repeatedly, indicating session issues. |

> "The Vercel Runtime Logs provide a live stream of all incoming requests and server-side logs, which is essential for diagnosing issues that only appear under production load." [1]

---

## 2. Authentication and Communication Integrity

The stability of the authentication flow is dependent on the reliable delivery of One-Time Passwords (OTP) via the Brevo SMTP relay. Failure in this component prevents user acquisition and dashboard access.

Maintenance teams must monitor the **Brevo Transactional Dashboard** to verify that delivery rates remain above 98%. Particular attention should be paid to the `NEXTAUTH_URL` configuration; any mismatch between the environment variables and the production domain will result in failed callback redirects, which will appear as `OAuthCallback` errors in the logs.

---

## 3. Database Performance and Resource Scaling

As a Prisma-backed application on Neon PostgreSQL, the database layer must be monitored for connection exhaustion and query latency. The following table outlines the key performance indicators for the data tier.

| Component | Metric | Optimal Range |
| :--- | :--- | :--- |
| **Active Connections** | Connection Pool Usage | < 80% of the maximum allocated limit. |
| **Query Latency** | Execution time for `getTransportGuides` | < 500ms per request. |
| **Resource Usage** | CPU and Storage I/O | Auto-scaling should handle spikes without sustained saturation. |

High latency in the `getAdminAnalytics` action may indicate a need for additional indexing on the `PropertyEvent` table if user interactions grow rapidly.

---

## 4. Security and Access Control Verification

The first 24 hours often see increased probing from automated bots and malicious actors. The security perimeter must be audited for unauthorized access attempts and data leakage.

Maintenance should perform a daily audit of the `AuditLog` table to review all administrative actions, including role changes and listing deletions. Furthermore, monitoring for a high volume of `403 Forbidden` errors from specific IP addresses can help identify and block potential brute-force or role-escalation attempts before they impact legitimate users.

---

## 5. Deployment and Incident Response

A successful launch requires a clear path for remediation in the event of a critical failure. The last stable deployment (Commit `ac24f65`) is currently designated as the primary rollback target.

> "A robust rollback strategy is the final line of defense, allowing the application to return to a known-good state within seconds of a detected failure." [2]

All production credentials, including Mapbox tokens and NextAuth secrets, should be backed up in a secure, encrypted environment to facilitate rapid recovery or environment recreation if necessary.

---

## References

- [1] Vercel Documentation: [Monitoring and Observability](https://vercel.com/docs/concepts/observability)
- [2] Next.js Deployment Guide: [Production Checklist and Best Practices](https://nextjs.org/docs/app/building-your-application/deploying)
