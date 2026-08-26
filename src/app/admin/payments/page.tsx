"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, CreditCard, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "../../../components/layout/PageTransition";
import { getPremiumPayments } from "../../actions/admin";

type Payment = Awaited<ReturnType<typeof getPremiumPayments>>[number];
type Filter = "ALL" | "PENDING" | "SUCCESS" | "FAILED" | "ABANDONED";

const statusStyles: Record<string, string> = {
  SUCCESS: "bg-emerald-100 text-emerald-800",
  PENDING: "bg-amber-100 text-amber-800",
  FAILED: "bg-rose-100 text-rose-800",
  ABANDONED: "bg-slate-100 text-slate-700",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "SUCCESS") return <CheckCircle2 className="h-4 w-4" />;
  if (status === "PENDING") return <Clock3 className="h-4 w-4" />;
  return <XCircle className="h-4 w-4" />;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadPayments = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await getPremiumPayments();
      setPayments(data);
      setLastUpdated(new Date().toISOString());
    } catch {
      if (!silent) toast.error("Unable to load premium payments.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPayments();
  }, []);

  const counts = useMemo(() => payments.reduce<Record<string, number>>((result, payment) => {
    result[payment.status] = (result[payment.status] || 0) + 1;
    return result;
  }, {}), [payments]);

  const successfulAmount = useMemo(() => payments
    .filter((payment) => payment.status === "SUCCESS")
    .reduce((sum, payment) => sum + payment.amount, 0), [payments]);

  const visiblePayments = filter === "ALL" ? payments : payments.filter((payment) => payment.status === filter);

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Premium Payments</h1>
            <p className="mt-1 max-w-3xl text-muted-foreground">Read-only reconciliation for Paystack annual premium checkouts. Premium access is activated only by server-side transaction verification.</p>
          </div>
          <button type="button" onClick={() => void loadPayments()} disabled={isLoading} className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-secondary disabled:cursor-wait disabled:opacity-60">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          This page never displays card numbers, authorization codes, secret keys, or provider credentials. It shows only application payment references and verification status. Use the Paystack dashboard for provider-side settlement and dispute details.
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><p className="text-sm text-muted-foreground">Records shown</p><p className="mt-1 text-3xl font-bold text-foreground">{payments.length}</p><p className="mt-1 text-xs text-muted-foreground">Latest 100 records</p></div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm"><p className="text-sm text-emerald-800">Verified payments</p><p className="mt-1 text-3xl font-bold text-emerald-900">{counts.SUCCESS || 0}</p><p className="mt-1 text-xs text-emerald-800">₦{successfulAmount.toLocaleString("en-NG")} recorded</p></div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm"><p className="text-sm text-amber-800">Pending</p><p className="mt-1 text-3xl font-bold text-amber-900">{counts.PENDING || 0}</p><p className="mt-1 text-xs text-amber-800">Awaiting provider confirmation</p></div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm"><p className="text-sm text-rose-800">Failed or abandoned</p><p className="mt-1 text-3xl font-bold text-rose-900">{(counts.FAILED || 0) + (counts.ABANDONED || 0)}</p><p className="mt-1 text-xs text-rose-800">No premium activation</p></div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["ALL", "PENDING", "SUCCESS", "FAILED", "ABANDONED"] as Filter[]).map((value) => (
            <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${filter === value ? "bg-[#008A4B] text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {value === "ALL" ? "All" : value[0] + value.slice(1).toLowerCase()} {value === "ALL" ? `(${payments.length})` : `(${counts[value] || 0})`}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-3 border-b border-border p-5"><CreditCard className="h-5 w-5 text-[#008A4B]" /><div><h2 className="font-bold text-foreground">Checkout reconciliation</h2><p className="mt-1 text-xs text-muted-foreground">{lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleString()}` : "Loading payment records..."}</p></div></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-secondary text-xs font-semibold uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Plan</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Reference</th><th className="px-5 py-3">Created</th><th className="px-5 py-3">Paid</th></tr></thead>
              <tbody className="divide-y divide-border">
                {isLoading ? <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">Loading premium payments...</td></tr> : visiblePayments.length === 0 ? <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">No payment records match this filter.</td></tr> : visiblePayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-secondary/60"><td className="px-5 py-4"><p className="font-semibold text-foreground">{payment.user.name || "Unnamed user"}</p><p className="text-xs text-muted-foreground">{payment.user.email || "No email"} · {payment.user.role}</p></td><td className="px-5 py-4 text-foreground">{payment.plan === "CORP_PREMIUM" ? "Corp Premium" : "Agent Premium"}</td><td className="px-5 py-4 font-bold text-foreground">₦{payment.amount.toLocaleString("en-NG")} <span className="font-normal text-xs text-muted-foreground">{payment.currency}</span></td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[payment.status] || "bg-secondary text-foreground"}`}><StatusIcon status={payment.status} />{payment.status}</span>{payment.failureReason && <p className="mt-1 max-w-[180px] text-xs text-rose-700">{payment.failureReason}</p>}</td><td className="max-w-[210px] break-all px-5 py-4 font-mono text-xs text-muted-foreground">{payment.reference}</td><td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">{new Date(payment.createdAt).toLocaleString()}</td><td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">{payment.paidAt ? new Date(payment.paidAt).toLocaleString() : "—"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
