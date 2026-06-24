"use client";

import { PageTransition } from "../../../components/layout/PageTransition";
import { Wallet, CheckCircle, XCircle } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useEffect, useState } from "react";
import { getPayouts } from "../../actions/admin";

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPayouts() {
      const data = await getPayouts();
      setPayouts(data);
      setIsLoading(false);
    }
    loadPayouts();
  }, []);

  const totalPending = payouts.filter(p => p.status === "Pending").reduce((sum, p) => sum + parseFloat(p.amount.replace(/[^0-9.-]+/g,"")), 0);
  const pendingCount = payouts.filter(p => p.status === "Pending").length;
  const totalProcessed = payouts.filter(p => p.status === "Approved").reduce((sum, p) => sum + parseFloat(p.amount.replace(/[^0-9.-]+/g,"")), 0);
  const processedCount = payouts.filter(p => p.status === "Approved").length;

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payout Management</h1>
          <p className="text-slate-500 mt-1">Review and process agent withdrawal requests.</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm">
            <h3 className="text-amber-600 font-medium mb-1">Pending Payouts</h3>
            <p className="text-3xl font-bold text-slate-900">₦{totalPending.toLocaleString()}</p>
            <p className="text-sm text-slate-500 mt-2">{pendingCount} Request{pendingCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm">
            <h3 className="text-green-600 font-medium mb-1">Processed Today</h3>
            <p className="text-3xl font-bold text-slate-900">₦{totalProcessed.toLocaleString()}</p>
            <p className="text-sm text-slate-500 mt-2">{processedCount} Request{processedCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
            <h3 className="text-blue-600 font-medium mb-1">Total Disbursed (Month)</h3>
            <p className="text-3xl font-bold text-slate-900">₦{totalProcessed.toLocaleString()}</p>
            <p className="text-sm text-slate-500 mt-2">{processedCount} Request{processedCount !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Withdrawal Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Agent</th>
                  <th className="px-6 py-4">Bank Details</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      Loading payouts...
                    </td>
                  </tr>
                ) : payouts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      No payouts found
                    </td>
                  </tr>
                ) : payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">{payout.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{payout.agent}</td>
                    <td className="px-6 py-4 text-slate-600">{payout.bank}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{payout.amount}</td>
                    <td className="px-6 py-4 text-slate-500">{payout.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        payout.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        payout.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {payout.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" className="bg-[#008A4B] hover:bg-[#006F3C] text-white rounded-lg px-3">
                            <CheckCircle className="w-4 h-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 rounded-lg px-3">
                            <XCircle className="w-4 h-4 mr-1" /> Deny
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
                          <Wallet className="w-4 h-4" />
                        </Button>
                      )}
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
