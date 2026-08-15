"use client";

import { useState, useEffect } from "react";

import { PageTransition } from "../../../components/layout/PageTransition";
import { ArrowDownRight, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";

import { getAgentEarnings } from "../../actions/agent";

export default function AgentEarningsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [data, setData] = useState<any>({
    transactions: [],
    confirmedExternalPaymentValue: 0,
    confirmedExternalPaymentCount: 0,
  });

  useEffect(() => {
    async function loadData() {
      if (!userId) return;
      const res = await getAgentEarnings();
      setData(res);
    }
    loadData();
  }, [userId]);

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">External Payment Confirmations</h1>
          <p className="text-muted-foreground mt-1">Track booking amounts you have confirmed as paid directly to you outside the app. The platform does not collect, hold, or transfer property funds.</p>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg">
          <p className="text-blue-100 font-medium mb-1">Confirmed external booking value (reference only)</p>
          <h2 className="text-5xl font-bold">₦{data.confirmedExternalPaymentValue.toLocaleString()}</h2>
          <p className="text-sm text-blue-200 mt-4">{data.confirmedExternalPaymentCount} booking record{data.confirmedExternalPaymentCount === 1 ? "" : "s"} marked as paid outside the app. This is not a wallet balance and cannot be withdrawn through Neat &amp; Affordable.</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Confirm property payment only after you have received it directly from the Corp Member. The app records the confirmation for booking workflow and notifications; it does not process or settle the payment.
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-bold text-foreground">Confirmed external payments</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {data.transactions.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No externally confirmed booking payments found.</div>
            ) : data.transactions.map((trx: any) => (
              <div key={trx.id} className="p-6 flex items-center justify-between hover:bg-secondary transition">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-100">
                    <ArrowDownRight className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">External payment confirmed for {trx.property?.title}</p>
                    <p className="text-sm text-muted-foreground">{new Date(trx.createdAt).toLocaleDateString()} • {trx.id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-green-600">₦{(trx.amount || 0).toLocaleString()}</p>
                  <p className="text-xs font-medium text-green-600 flex items-center justify-end gap-1 mt-1"><CheckCircle2 className="w-3 h-3"/> Confirmed outside app</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </PageTransition>
  );
}
