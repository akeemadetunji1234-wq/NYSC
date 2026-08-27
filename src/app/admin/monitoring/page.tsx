"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, Clock3, Database, Mail, RefreshCw, Server, TriangleAlert, Webhook } from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "../../../components/layout/PageTransition";
import { getOperationalDiagnostics } from "../../actions/admin";

type Diagnostics = Awaited<ReturnType<typeof getOperationalDiagnostics>>;

function ReadyBadge({ ready }: { ready: boolean }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${ready ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}><span className={`h-1.5 w-1.5 rounded-full ${ready ? "bg-emerald-500" : "bg-amber-500"}`} />{ready ? "Ready" : "Needs setup"}</span>;
}

export default function AdminMonitoringPage() {
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDiagnostics = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      setDiagnostics(await getOperationalDiagnostics());
    } catch {
      if (!silent) toast.error("Unable to load operational diagnostics.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDiagnostics();
    const interval = setInterval(() => void loadDiagnostics(true), 30_000);
    return () => clearInterval(interval);
  }, []);

  const dbReady = diagnostics?.database.status === "ok";
  const paystackReady = diagnostics?.providers.paystack.configured === true;
  const emailReady = diagnostics?.providers.email.configured === true;
  const cronReady = diagnostics?.scheduledJobs.cronSecretConfigured === true;

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold text-foreground">Production Monitoring</h1><p className="mt-1 max-w-3xl text-muted-foreground">Safe application diagnostics for database health, provider setup, scheduled jobs, payments, and audit activity. Secret values are never returned.</p></div><button type="button" onClick={() => void loadDiagnostics()} disabled={isLoading} className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-secondary disabled:opacity-60"><RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh</button></div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-muted-foreground">Database</p><Database className="h-5 w-5 text-[#008A4B]" /></div><div className="mt-3"><ReadyBadge ready={dbReady} /></div><p className="mt-2 text-xs text-muted-foreground">{diagnostics ? `${diagnostics.database.latencyMs}ms SELECT 1 check` : "Checking connection..."}</p></div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-muted-foreground">Paystack</p><Webhook className="h-5 w-5 text-blue-600" /></div><div className="mt-3"><ReadyBadge ready={paystackReady} /></div><p className="mt-2 text-xs text-muted-foreground">{paystackReady ? "Checkout webhook can be enabled" : "PAYSTACK_SECRET_KEY is not configured"}</p></div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-muted-foreground">Email provider</p><Mail className="h-5 w-5 text-purple-600" /></div><div className="mt-3"><ReadyBadge ready={emailReady} /></div><p className="mt-2 text-xs text-muted-foreground">{emailReady ? "Reminder delivery configured" : "No email provider detected"}</p></div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-muted-foreground">Scheduled jobs</p><Clock3 className="h-5 w-5 text-amber-600" /></div><div className="mt-3"><ReadyBadge ready={cronReady} /></div><p className="mt-2 text-xs text-muted-foreground">{cronReady ? "CRON_SECRET present" : "CRON_SECRET needs configuration"}</p></div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm"><div className="mb-5 flex items-center gap-3"><Activity className="h-5 w-5 text-[#008A4B]" /><div><h2 className="font-bold text-foreground">Payment state counts</h2><p className="mt-1 text-xs text-muted-foreground">All counts are application records, not provider settlement totals.</p></div></div><div className="grid grid-cols-2 gap-3">{["PENDING", "SUCCESS", "FAILED", "ABANDONED"].map((status) => <div key={status} className="rounded-xl bg-secondary p-4"><p className="text-xs font-bold text-muted-foreground">{status}</p><p className="mt-1 text-2xl font-bold text-foreground">{diagnostics?.payments[status] || 0}</p></div>)}</div></div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm"><div className="mb-5 flex items-center gap-3"><Server className="h-5 w-5 text-blue-600" /><div><h2 className="font-bold text-foreground">Operational signals</h2><p className="mt-1 text-xs text-muted-foreground">Last sampled {diagnostics ? new Date(diagnostics.generatedAt).toLocaleString() : "—"}</p></div></div><div className="space-y-3 text-sm"><div className="flex items-center justify-between rounded-xl bg-secondary p-4"><span className="text-muted-foreground">Audit events in last 24 hours</span><strong className="text-foreground">{diagnostics?.auditEventsLast24Hours ?? "—"}</strong></div><div className="flex items-center justify-between rounded-xl bg-secondary p-4"><span className="text-muted-foreground">Realtime notifications sent</span><strong className="text-foreground">{diagnostics?.notifications.realtime.SENT || 0}</strong></div><div className="flex items-center justify-between rounded-xl bg-secondary p-4"><span className="text-muted-foreground">Email delivery failures</span><strong className="text-rose-700">{diagnostics?.notifications.email.failed || 0}</strong></div><div className="flex items-center justify-between rounded-xl bg-secondary p-4"><span className="text-muted-foreground">Paystack webhook path</span><code className="text-xs text-foreground">{diagnostics?.providers.paystack.webhookPath || "—"}</code></div><div className="flex items-center justify-between rounded-xl bg-secondary p-4"><span className="text-muted-foreground">Live payment activation</span><span className="font-bold text-amber-700">{paystackReady ? "Available" : "Disabled safely"}</span></div></div></div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><p>The monitoring page reports presence and health only. It does not expose `DATABASE_URL`, Paystack keys, email credentials, session secrets, or card data.</p></div></div>
        {!dbReady && diagnostics && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"><div className="flex items-start gap-3"><TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" /><p>Database health check failed. Review Vercel logs and database provider availability before processing payments.</p></div></div>}
      </div>
    </PageTransition>
  );
}
