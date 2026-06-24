"use client";
import { useState, useEffect } from "react";

import { PageTransition } from "../../../components/layout/PageTransition";
import { Wallet, ArrowDownRight, ArrowUpRight, CheckCircle2, Clock } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useSession } from "next-auth/react";

import { getAgentEarnings } from "../../actions/agent";

export default function AgentEarningsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [data, setData] = useState<any>({
    transactions: [],
    totalEarned: 0,
    availableBalance: 0,
    pendingClearance: 0
  });

  useEffect(() => {
    async function loadData() {
      if (!userId) return;
      const res = await getAgentEarnings(userId);
      setData(res);
    }
    loadData();
  }, [userId]);

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Earnings & Payouts</h1>
          <p className="text-slate-500 mt-1">Track your income and request withdrawals.</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-blue-100 font-medium mb-1">Available Balance</p>
            <h2 className="text-5xl font-bold">₦{data.availableBalance.toLocaleString()}<span className="text-2xl text-blue-200">.00</span></h2>
            <p className="text-sm text-blue-200 mt-4 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Next automatic payout on Oct 30, 2026
            </p>
          </div>
          <Button className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-6 rounded-xl font-bold text-lg shadow-sm">
            Request Payout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
             <h3 className="text-slate-500 font-medium mb-2">Total Earned (All Time)</h3>
             <p className="text-3xl font-bold text-slate-900">₦{data.totalEarned.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
             <h3 className="text-slate-500 font-medium mb-2">Pending Clearance</h3>
             <p className="text-3xl font-bold text-slate-900">₦{data.pendingClearance.toLocaleString()}</p>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {data.transactions.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No transactions found.</div>
            ) : data.transactions.map((trx: any) => (
              <div key={trx.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-green-100`}>
                    <ArrowDownRight className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Booking Payment for {trx.property?.title}</p>
                    <p className="text-sm text-slate-500">{new Date(trx.createdAt).toLocaleDateString()} • {trx.id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg text-green-600`}>+₦{(trx.amount || 0).toLocaleString()}</p>
                  {trx.status === 'COMPLETED' ? (
                    <p className="text-xs font-medium text-green-600 flex items-center justify-end gap-1 mt-1"><CheckCircle2 className="w-3 h-3"/> Completed</p>
                  ) : (
                    <p className="text-xs font-medium text-amber-600 flex items-center justify-end gap-1 mt-1"><Clock className="w-3 h-3"/> Pending</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </PageTransition>
  );
}
