"use client";

import { useEffect, useMemo, useState } from "react";
import { PageTransition } from "../../../components/layout/PageTransition";
import { BarChart3, TrendingUp, Eye, Bookmark, MessageSquare, CalendarCheck, RefreshCw, Download, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { exportAgentAnalytics, getAgentAnalytics, getAgentPremiumStatus } from "../../actions/premium";
import { Button } from "../../../components/ui/button";
import { toast } from "sonner";

type AnalyticsRow = { id: string; title: string; views: number; saves: number; inquiries: number; bookings: number; boosts: number; conversionRate: number };
type Report = { from: string | Date; to: string | Date; leads: number; totals: { views: number; saves: number; inquiries: number; bookings: number; boosts: number }; data: AnalyticsRow[] };

function toDateInput(date: Date) { return date.toISOString().slice(0, 10); }

export default function AdvancedAnalyticsPage() {
  const initialFrom = useMemo(() => { const date = new Date(); date.setDate(date.getDate() - 30); return toDateInput(date); }, []);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(toDateInput(new Date()));
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPremium, setHasPremium] = useState<boolean | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadStats = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await getAgentAnalytics({ from, to: `${to}T23:59:59.999Z` });
      setReport(data as Report);
      setLastUpdated(new Date());
    } catch (error: any) {
      if (!silent) toast.error(error.message || "Failed to fetch analytics");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const status = await getAgentPremiumStatus();
        if (!active) return;
        setHasPremium(status.active);
        if (status.active) await loadStats();
        else setIsLoading(false);
      } catch (error: any) {
        if (!active) return;
        setHasPremium(false);
        setIsLoading(false);
        toast.error(error.message || "Failed to check premium access");
      }
    })();
    return () => { active = false; };
  }, []);

  const downloadCsv = async () => {
    try {
      const csv = await exportAgentAnalytics({ from, to: `${to}T23:59:59.999Z` });
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `nysc-agent-analytics-${from}-to-${to}.csv`; anchor.click(); URL.revokeObjectURL(url);
    } catch (error: any) { toast.error(error.message || "Failed to export analytics"); }
  };

  const totals = report?.totals ?? { views: 0, saves: 0, inquiries: 0, bookings: 0, boosts: 0 };
  const conversionRate = totals.views > 0 ? ((totals.inquiries / totals.views) * 100).toFixed(2) : "0.00";
  const rows = report?.data ?? [];
  const metrics: { label: string; value: number | string; icon: LucideIcon; color: string }[] = [
    { label: "Views", value: totals.views, icon: Eye, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
    { label: "Saves", value: totals.saves, icon: Bookmark, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Inquiries", value: totals.inquiries, icon: MessageSquare, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
    { label: "Bookings", value: totals.bookings, icon: CalendarCheck, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" },
    { label: "Boosts", value: totals.boosts, icon: Zap, color: "text-orange-600 bg-orange-50 dark:bg-orange-950/30" },
    { label: "Inquiry rate", value: `${conversionRate}%`, icon: TrendingUp, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30" },
  ];

  return <PageTransition><div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4"><div><h1 className="text-3xl font-bold text-foreground flex items-center gap-2">Performance Analytics <BarChart3 className="w-6 h-6 text-purple-600" /></h1><p className="text-muted-foreground mt-1">Live event metrics for your listings and boosts.</p></div>{hasPremium && <div className="flex flex-wrap items-center gap-2"><label className="text-xs text-muted-foreground">From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="ml-1 rounded-lg border border-border bg-card px-2 py-1.5 text-sm" /></label><label className="text-xs text-muted-foreground">To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="ml-1 rounded-lg border border-border bg-card px-2 py-1.5 text-sm" /></label><Button variant="outline" size="sm" onClick={() => loadStats()} disabled={isLoading} className="gap-2"><RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} /> Apply</Button><Button variant="outline" size="sm" onClick={downloadCsv} disabled={!report} className="gap-2"><Download className="w-3.5 h-3.5" /> CSV</Button></div>}</div>
    {hasPremium === null && <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">Checking Agent Premium access...</div>}
    {hasPremium === false && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900/40 dark:bg-amber-950/20"><h2 className="text-xl font-bold text-foreground">Agent Premium required</h2><p className="mt-2 text-muted-foreground">Performance Analytics is available on the ₦10,000/month Agent Premium plan. No metrics are shown until the entitlement is active.</p><a href="/agent/premium" className="mt-5 inline-flex rounded-lg bg-[#008A4B] px-4 py-2 font-semibold text-white">View Agent Premium</a></div>}
    {hasPremium && <>
      {lastUpdated && <p className="text-xs text-muted-foreground">Updated {lastUpdated.toLocaleTimeString()} · Period {from} to {to}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">{metrics.map(({ label, value, icon: Icon, color }) => <div key={label} className="p-5 bg-card rounded-2xl border border-border shadow-sm"><div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}><Icon className="w-5 h-5" /></div><h3 className="text-2xl font-bold text-foreground">{typeof value === "number" ? value.toLocaleString() : value}</h3><p className="text-sm font-medium text-muted-foreground mt-1">{label}</p></div>)}</div>
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"><div className="p-5 border-b border-border"><h2 className="text-lg font-bold text-foreground">Listing performance</h2><p className="text-xs text-muted-foreground mt-1">Metrics are calculated from property-event records during the selected period. A listing with no events shows no fabricated activity.</p></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground"><tr>{["Listing", "Views", "Saves", "Inquiries", "Bookings", "Boosts", "Inquiry rate"].map((head) => <th className="p-4" key={head}>{head}</th>)}</tr></thead><tbody className="divide-y divide-border">{isLoading ? <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading live metrics...</td></tr> : rows.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No event data for this period.</td></tr> : rows.map((property) => <tr key={property.id} className="hover:bg-secondary/30 transition"><td className="p-4 font-semibold text-foreground max-w-xs truncate">{property.title}</td><td className="p-4">{property.views.toLocaleString()}</td><td className="p-4">{property.saves.toLocaleString()}</td><td className="p-4">{property.inquiries.toLocaleString()}</td><td className="p-4">{property.bookings.toLocaleString()}</td><td className="p-4">{property.boosts.toLocaleString()}</td><td className="p-4 font-bold text-purple-600">{property.conversionRate.toFixed(2)}%</td></tr>)}</tbody></table></div></div>
    </>}
  </div></PageTransition>;
}
