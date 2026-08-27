"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle2, Clock3, Mail, MailCheck, MailX, RefreshCw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "../../../components/layout/PageTransition";
import { getAdminNotificationReport } from "../../actions/admin";

type NotificationReport = Awaited<ReturnType<typeof getAdminNotificationReport>>;
type NotificationRow = NotificationReport["notifications"][number];
type DeliveryFilter = "ALL" | "PENDING" | "SENT" | "FAILED";
type EmailDisplayStatus = DeliveryFilter | "NOT_REQUESTED";

const notificationTypes = [
  "NEW_BOOKING",
  "BOOKING_STATUS_CHANGE",
  "NEW_MESSAGE",
  "NEW_REVIEW",
  "VIEWING_UPDATE",
  "AGENT_VERIFIED",
  "PREMIUM_EXPIRY_REMINDER",
  "PREMIUM_PAYMENT_SIMULATED",
  "PREMIUM_PAYMENT_CONFIRMED",
] as const;

function StatusBadge({ status, label }: { status: EmailDisplayStatus; label?: string }) {
  const styles: Record<EmailDisplayStatus, string> = {
    SENT: "bg-emerald-100 text-emerald-800",
    FAILED: "bg-rose-100 text-rose-800",
    PENDING: "bg-amber-100 text-amber-800",
    ALL: "bg-slate-100 text-slate-700",
    NOT_REQUESTED: "bg-slate-100 text-slate-600",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${styles[status]}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{label || status}</span>;
}

function getEmailStatus(notification: NotificationRow): EmailDisplayStatus {
  if (notification.emailDeliveredAt) return "SENT";
  if (notification.lastEmailError) return "FAILED";
  if (notification.emailDeliveryAttempts === 0) return "NOT_REQUESTED";
  return "PENDING";
}

function getRealtimeStatus(notification: NotificationRow): DeliveryFilter {
  return notification.deliveryStatus as DeliveryFilter;
}

export default function AdminNotificationsPage() {
  const [report, setReport] = useState<NotificationReport | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryFilter>("ALL");
  const [emailStatus, setEmailStatus] = useState<DeliveryFilter>("ALL");
  const [type, setType] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadReport = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const nextReport = await getAdminNotificationReport({
        deliveryStatus,
        emailStatus,
        type: type || undefined,
      });
      setReport(nextReport);
    } catch {
      if (!silent) toast.error("Unable to load notification delivery data.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadReport();
    const interval = setInterval(() => void loadReport(true), 30_000);
    return () => clearInterval(interval);
  }, [deliveryStatus, emailStatus, type]);

  const summary = report?.summary;

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-[#008A4B]"><Bell className="h-5 w-5" /></div>
              <div><h1 className="text-2xl font-bold text-foreground">Notification Center</h1><p className="mt-1 text-muted-foreground">Monitor realtime and email delivery for the last 30 days. Secret values are never shown.</p></div>
            </div>
          </div>
          <button type="button" onClick={() => void loadReport()} disabled={isLoading} className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-secondary disabled:opacity-60"><RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh</button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><p className="text-sm font-semibold text-muted-foreground">Filtered records</p><p className="mt-2 text-3xl font-bold text-foreground">{summary?.total ?? "—"}</p><p className="mt-1 text-xs text-muted-foreground">Latest 100 shown</p></div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-muted-foreground">Email sent</p><MailCheck className="h-5 w-5 text-emerald-600" /></div><p className="mt-2 text-3xl font-bold text-foreground">{summary?.email.sent ?? "—"}</p></div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-muted-foreground">Email pending</p><Clock3 className="h-5 w-5 text-amber-600" /></div><p className="mt-2 text-3xl font-bold text-foreground">{summary?.email.pending ?? "—"}</p></div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-muted-foreground">Email failed</p><MailX className="h-5 w-5 text-rose-600" /></div><p className="mt-2 text-3xl font-bold text-foreground">{summary?.email.failed ?? "—"}</p></div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-muted-foreground">Realtime failed</p><TriangleAlert className="h-5 w-5 text-rose-600" /></div><p className="mt-2 text-3xl font-bold text-foreground">{summary?.realtime.failed ?? "—"}</p></div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><Mail className="h-5 w-5 text-[#008A4B]" /><div><h2 className="font-bold text-foreground">Delivery filters</h2><p className="text-xs text-muted-foreground">The report refreshes automatically every 30 seconds.</p></div></div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="text-sm font-semibold text-foreground">Realtime status<select value={deliveryStatus} onChange={(event) => setDeliveryStatus(event.target.value as DeliveryFilter)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal text-foreground"><option value="ALL">All statuses</option><option value="PENDING">Pending</option><option value="SENT">Sent</option><option value="FAILED">Failed</option></select></label>
            <label className="text-sm font-semibold text-foreground">Email status<select value={emailStatus} onChange={(event) => setEmailStatus(event.target.value as DeliveryFilter)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal text-foreground"><option value="ALL">All statuses</option><option value="PENDING">Pending</option><option value="SENT">Sent</option><option value="FAILED">Failed</option></select></label>
            <label className="text-sm font-semibold text-foreground">Notification type<select value={type} onChange={(event) => setType(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-normal text-foreground"><option value="">All notification types</option>{notificationTypes.map((notificationType) => <option key={notificationType} value={notificationType}>{notificationType.replaceAll("_", " ")}</option>)}</select></label>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="font-bold text-foreground">Recent notification delivery</h2><p className="mt-1 text-xs text-muted-foreground">Recipient names and email addresses are shown only to authenticated administrators.</p></div><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-secondary text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3">Notification</th><th className="px-5 py-3">Recipient</th><th className="px-5 py-3">Realtime</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Attempts</th><th className="px-5 py-3">Created</th></tr></thead>
              <tbody className="divide-y divide-border">
                {report?.notifications.map((notification) => {
                  const currentEmailStatus = getEmailStatus(notification);
                  const currentRealtimeStatus = getRealtimeStatus(notification);
                  return <tr key={notification.id} className="align-top hover:bg-secondary/50"><td className="max-w-[300px] px-5 py-4"><p className="font-semibold text-foreground">{notification.title}</p><p className="mt-1 text-xs text-muted-foreground">{notification.type}</p><p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{notification.body}</p>{notification.lastEmailError && <p className="mt-2 text-xs font-medium text-rose-700">Email error: {notification.lastEmailError}</p>}{notification.lastDeliveryError && <p className="mt-2 text-xs font-medium text-rose-700">Realtime error: {notification.lastDeliveryError}</p>}</td><td className="px-5 py-4"><p className="font-medium text-foreground">{notification.user.name || "Unnamed user"}</p><p className="mt-1 text-xs text-muted-foreground">{notification.user.email || "No email"}</p></td><td className="px-5 py-4"><StatusBadge status={currentRealtimeStatus} /><p className="mt-2 text-xs text-muted-foreground">{notification.deliveryAttempts} attempt{notification.deliveryAttempts === 1 ? "" : "s"}</p></td><td className="px-5 py-4"><StatusBadge status={currentEmailStatus} label={currentEmailStatus === "NOT_REQUESTED" ? "Not requested" : undefined} /><p className="mt-2 text-xs text-muted-foreground">{notification.emailDeliveryAttempts} attempt{notification.emailDeliveryAttempts === 1 ? "" : "s"}</p></td><td className="px-5 py-4 text-xs text-muted-foreground"><p>Realtime: {notification.deliveredAt ? new Date(notification.deliveredAt).toLocaleString() : "—"}</p><p className="mt-1">Email: {notification.emailDeliveredAt ? new Date(notification.emailDeliveredAt).toLocaleString() : "—"}</p></td><td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</td></tr>;
                })}
                {!isLoading && report?.notifications.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">No notifications match the selected filters.</td></tr>}
                {isLoading && <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">Loading notification delivery data…</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
