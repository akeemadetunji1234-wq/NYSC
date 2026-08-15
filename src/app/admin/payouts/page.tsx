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
  feeStatus: "PAID";
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

  const confirmedExternalAmount = settlements.reduce((sum, item) => sum + item.amount, 0);

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">External Payment Confirmations</h1>
            <p className="text-muted-foreground mt-1">Live booking records that Agents marked as paid directly outside the app. Neat &amp; Affordable does not collect, hold, transfer, or pay out property funds.</p>
          </div>
          <Button variant="outline" onClick={() => loadSettlements()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          These are booking reference records, not settlement or withdrawal requests. The application intentionally has no approve, release, withdrawal, bank-account, escrow, or payment-provider controls because property payments are handled directly between Corp Members and Agents outside the platform.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card p-6 rounded-2xl border border-green-100 shadow-sm">
            <h3 className="text-green-600 font-medium mb-1">Confirmed outside the app</h3>
            <p className="text-3xl font-bold text-foreground">₦{confirmedExternalAmount.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-2">Reference value across {settlements.length} booking record{settlements.length === 1 ? "" : "s"}</p>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-blue-100 shadow-sm">
            <h3 className="text-blue-600 font-medium mb-1">Platform funds held</h3>
            <p className="text-3xl font-bold text-foreground">₦0</p>
            <p className="text-sm text-muted-foreground mt-2">No property funds are collected or held by the app</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex items-center gap-3">
            <Wallet className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-foreground">External payment confirmation records</h2>
              <p className="text-xs text-muted-foreground mt-1">Amounts are server-recorded rent references only; no platform fee, wallet balance, escrow, or payout is created.</p>
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
                  <th className="px-6 py-4">Payment handling</th>
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
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        Confirmed outside app
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
