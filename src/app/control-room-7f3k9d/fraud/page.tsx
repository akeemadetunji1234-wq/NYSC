"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { PageTransition } from "../../../components/layout/PageTransition";
import { getAgentFraudRiskReport } from "../../actions/admin";

export default function FraudPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { void getAgentFraudRiskReport().then(setRows).catch(() => setRows([])); }, []);
  return <PageTransition><div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8"><div><h1 className="text-2xl font-black">Agent fraud-risk signals</h1><p className="mt-1 text-sm text-muted-foreground">These are review signals, not proof of fraud. They combine recent listing volume, viewing response rate, response delay, and completed viewings.</p></div><div className="overflow-hidden rounded-2xl border border-border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-secondary/60 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Agent</th><th className="px-4 py-3">30d listings</th><th className="px-4 py-3">Response</th><th className="px-4 py-3">Completed</th><th className="px-4 py-3">Risk</th><th className="px-4 py-3">Signals</th></tr></thead><tbody className="divide-y divide-border">{rows.map((row) => <tr key={row.id}><td className="px-4 py-4 font-semibold">{row.name}</td><td className="px-4 py-4">{row.recentListings}</td><td className="px-4 py-4">{row.responseRate === null ? "No requests" : `${row.responseRate}%`}{row.averageResponseHours !== null && <span className="ml-1 text-xs text-muted-foreground">({row.averageResponseHours}h)</span>}</td><td className="px-4 py-4">{row.completedViewings}</td><td className="px-4 py-4"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${row.risk === "HIGH" ? "bg-red-100 text-red-700" : row.risk === "REVIEW" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{row.risk === "LOW" ? <ShieldCheck className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}{row.risk}</span></td><td className="max-w-md px-4 py-4 text-xs text-muted-foreground">{row.flags.length ? row.flags.join("; ") : "No current signal"}</td></tr>)}</tbody></table></div></div></div></PageTransition>;
}
