"use client";

import { PageTransition } from "../../../components/layout/PageTransition";
import { Wallet, RefreshCw } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useEffect, useState } from "react";
import { getPayouts } from "../../actions/admin";
import { toast } from "sonner";

type Settlement = {
  id: string;
  property: string;
  agent: string;
  amount: number;
  date: string;
  bookingStatus: string;
  feeStatus: "PAID" | "HELD_IN_ESCROW" | "RELEASED_TO_AGENT";
};

const feeStatusLabel: Record<Settlement["feeStatus"], string> = {
  PAID: "Awaiting release",
  HELD_IN_ESCROW: "Held in escrow",
  RELEASED_TO_AGENT: "Released to agent",
};

export default function AdminPayoutsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettlements = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await getPayouts();
      setSettlements(data as Settlement[]);
    } catch {
      if (!silent) toast.error("Failed to load settlement records");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettlements();
    const interval = setInterval(() => loadSettlements(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const heldAmount = settlements
    .filter((item) => item.feeStatus !== "RELEASED_TO_AGENT")
    .reduce((sum, item) => sum + item.amount, 0);
  const releasedAmount = settlements
    .filter((item) => item.feeStatus === "RELEASED_TO_AGENT")
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settlement Records</h1>
            <p className="text-muted-foreground mt-1">Live booking fee states. Bank payout processing is not enabled until a payout provider and ledger are configured.</p>
          </div>
          <Button variant="outline" onClick={() => loadSettlements()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          These are **settlement records**, not completed withdrawal requests. The application intentionally does not show approve or deny controls because there is currently no durable payout ledger, bank-account verification, or payment-provider webhook behind them.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-2xl border border-amber-100 shadow-sm">
            <h3 className="text-amber-600 font-medium mb-1">Held or awaiting release</h3>
            <p className="text-3xl font-bold text-foreground">₦{heldAmount.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-2">{settlements.filter((item) => item.feeStatus !== "RELEASED_TO_AGENT").length} records</p>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-green-100 shadow-sm">
            <h3 className="text-green-600 font-medium mb-1">Released to agent</h3>
            <p className="text-3xl font-bold text-foreground">₦{releasedAmount.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-2">{settlements.filter((item) => item.feeStatus === "RELEASED_TO_AGENT").length} records</p>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-blue-100 shadow-sm">
            <h3 className="text-blue-600 font-medium mb-1">Total tracked</h3>
            <p className="text-3xl font-bold text-foreground">₦{(heldAmount + releasedAmount).toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-2">{settlements.length} booking records</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex items-center gap-3">
            <Wallet className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-foreground">Booking settlement queue</h2>
              <p className="text-xs text-muted-foreground mt-1">Amounts are the server-recorded booking amounts; no assumed platform fee is applied.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary text-muted-foreground font-medium">
                <tr>
                  <th className="px-6 py-4">Booking</th>
                  <th className="px-6 py-4">Property</th>
                  <th className="px-6 py-4">Agent</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Recorded</th>
                  <th className="px-6 py-4">Fee status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading settlement records...</td></tr>
                ) : settlements.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No settlement records found.</td></tr>
                ) : settlements.map((settlement) => (
                  <tr key={settlement.id} className="hover:bg-secondary transition">
                    <td className="px-6 py-4 font-mono text-xs">{settlement.id.slice(-8).toUpperCase()}</td>
                    <td className="px-6 py-4 text-muted-foreground">{settlement.property}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{settlement.agent}</td>
                    <td className="px-6 py-4 font-bold text-foreground">₦{settlement.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(settlement.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${settlement.feeStatus === "RELEASED_TO_AGENT" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {feeStatusLabel[settlement.feeStatus]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
