import { PageTransition } from "../../../components/layout/PageTransition";
import {
  Bell,
  CheckCircle2,
  CreditCard,
  Globe,
  Info,
  ShieldCheck,
  Wrench,
  XCircle,
} from "lucide-react";

function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        enabled
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {enabled ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {enabled ? "Enabled" : "Not available"}
    </span>
  );
}

export default function AdminSettingsPage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl space-y-8 p-4 pb-20 md:p-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Review the live platform configuration and product rules.
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-100">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Read-only configuration in this release</p>
            <p className="mt-1 text-sm text-blue-800/80 dark:text-blue-200/80">
              Editable fee, payout, notification, and maintenance controls are intentionally not
              exposed until each setting has a database-backed value, server-side enforcement, and
              an auditable change path.
            </p>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-3" aria-label="Platform status">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <CreditCard className="h-5 w-5 text-[#008A4B]" />
              <StatusBadge enabled={false} />
            </div>
            <h2 className="font-bold text-foreground">Property payments</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              No property payment is collected or calculated inside the application. Booking records
              are created after the agent confirms an external payment.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <Globe className="h-5 w-5 text-[#008A4B]" />
              <StatusBadge enabled={true} />
            </div>
            <h2 className="font-bold text-foreground">Premium entitlements</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Corp Member Premium is ₦5,000 per annum and Agent Premium is ₦10,000 per annum, each as a one-time payment. Access is
              controlled by database-backed entitlement checks and annual expiry.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <Bell className="h-5 w-5 text-[#008A4B]" />
              <StatusBadge enabled={true} />
            </div>
            <h2 className="font-bold text-foreground">Notifications</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Database writes remain available when the optional realtime provider is not configured;
              realtime delivery is enabled only when its production keys are present.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-secondary/50 p-6">
            <h2 className="text-lg font-bold text-foreground">Operational policies</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Controls that are not backed by a live server action are shown as policy status rather
              than interactive switches.
            </p>
          </div>
          <div className="divide-y divide-border">
            <div className="flex items-start gap-4 p-6">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#008A4B]" />
              <div>
                <h3 className="font-semibold text-foreground">Agent and listing verification</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Verification decisions are handled through the existing admin review and listing
                  safety workflows. No client-only auto-approval switch is presented here.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6">
              <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
              <div>
                <h3 className="font-semibold text-foreground">Payouts and BVN collection</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Payout processing is not part of the current product model. There is no admin
                  payout ledger, fee deduction, or BVN requirement exposed by this page.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6">
              <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
              <div>
                <h3 className="font-semibold text-foreground">Maintenance mode</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  A maintenance switch is not exposed until it is backed by a server-side flag,
                  role-aware enforcement, and an audit event. This avoids a misleading control that
                  changes only browser state.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
