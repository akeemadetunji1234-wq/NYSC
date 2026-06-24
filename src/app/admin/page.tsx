export const dynamic = "force-dynamic";

import { getDashboardStats } from "../actions/admin";
import { Users, Building, AlertCircle, FileText } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Platform Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your real estate marketplace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Users className="w-5 h-5" /></div>
            <h3 className="font-bold text-slate-700">Total Users</h3>
          </div>
          <p className="text-4xl font-black text-slate-900">{stats.users}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Building className="w-5 h-5" /></div>
            <h3 className="font-bold text-slate-700">Total Agents</h3>
          </div>
          <p className="text-4xl font-black text-slate-900">{stats.agents}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><AlertCircle className="w-5 h-5" /></div>
            <h3 className="font-bold text-slate-700">Pending Agents</h3>
          </div>
          <p className="text-4xl font-black text-slate-900">{stats.pendingAgents}</p>
          {stats.pendingAgents > 0 && (
            <Link href="/admin/agents" className="absolute inset-0 bg-amber-50/50 flex items-center justify-center opacity-0 hover:opacity-100 transition backdrop-blur-sm">
              <span className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold shadow-md">Review Now</span>
            </Link>
          )}
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><FileText className="w-5 h-5" /></div>
            <h3 className="font-bold text-slate-700">Properties</h3>
          </div>
          <p className="text-4xl font-black text-slate-900">{stats.properties}</p>
        </div>
      </div>
    </div>
  );
}
