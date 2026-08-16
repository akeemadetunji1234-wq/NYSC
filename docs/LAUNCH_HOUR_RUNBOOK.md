# Launch Hour Metrics and Database Incident Runbook

This document provides a targeted monitoring strategy for the first 60 minutes of the **Neat & Affordable** launch and a tactical runbook for addressing database connection saturation during peak traffic.

---

## 1. Critical Launch Hour Metrics (Vercel Dashboard)

During the first hour, focus on "Golden Signals" that indicate immediate system failure or severe user friction.

| Metric | Monitoring View | Critical Threshold |
| :--- | :--- | :--- |
| **5xx Error Rate** | Logs / Analytics | > 1% of total requests. Indicates backend crashes or database failures. |
| **P99 Latency** | Speed Insights | > 2000ms. High latency on `/member/transport` suggests database bottlenecks. |
| **Auth Success Rate** | Logs (filter `/api/auth`) | Any `OAuthCallback` or `401` errors on valid Google sign-ins. |
| **Function Execution Time** | Observability Tab | Sustained "Execution Timed Out" errors for server actions. |

### Immediate Action Items
- **Watch the Real-Time Log Stream**: Keep a tab open on `https://vercel.com/.../logs`. Filter for `level:error`.
- **Verify Cold Starts**: The first few users to access the **Transport Guide** will trigger a cold start. Ensure this doesn't exceed the 10-second Vercel function timeout.

---

## 2. Incident Runbook: Database Connection Spikes

If the Neon PostgreSQL database reaches its connection limit, Prisma will throw `P2024` or `P2025` errors, and the app will become unresponsive.

### Phase 1: Detection and Triage
1. **Confirm the Error**: Check Vercel logs for `PrismaClientInitializationError: Ready check failed: connection limit reached`.
2. **Identify the Source**: In the Neon dashboard, check the "Active Connections" graph. 
   - *Legitimate Traffic*: Gradual increase following a marketing push.
   - *Malicious/Bot Traffic*: Sharp, vertical spike from a limited set of IP addresses.

### Phase 2: Immediate Mitigation
1. **Scale Database Resources**:
   - If using Neon Serverless, increase the "Compute Unit" (CU) limit to allow for more parallel connections.
2. **Adjust Connection Pooling**:
   - Update the `DATABASE_URL` in Vercel to include `?connection_limit=20` (or a lower value) to prevent individual serverless functions from hogging too many connections.
3. **Enable Rate Limiting**:
   - If the spike is malicious, use the Vercel Firewall (if available) or update `middleware.ts` to block the offending IP ranges.

### Phase 3: Recovery and Post-Mortem
1. **Clear Idle Connections**: If necessary, manually terminate idle sessions in the Neon SQL editor using `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';`.
2. **Optimize Prisma Usage**: Ensure all server actions are using a singleton Prisma client to avoid multiple instantiations per request.
3. **Long-term Fix**: Consider implementing a dedicated connection pooler like **PgBouncer** or **Prisma Data Proxy** if traffic remains consistently high.

---

## References

- [1] Prisma Documentation: [Connection Management in Serverless Environments](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [2] Neon Documentation: [Managing Connections and Scaling](https://neon.tech/docs/manage/connections)
- [3] Vercel Documentation: [Handling Serverless Function Timeouts](https://vercel.com/docs/concepts/functions/serverless-functions#timeout)
