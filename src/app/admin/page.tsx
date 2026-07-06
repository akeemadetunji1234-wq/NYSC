export const dynamic = "force-dynamic";

import { getDashboardStats } from "../actions/admin";
import { Users, Building, AlertCircle, FileText, RefreshCw } from "lucide-react";
import Link from "next/link";
import { AdminMetrics } from "../../features/admin/AdminMetrics";
import { AutoRefresh } from "./AutoRefresh";

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div className="p-4 md:p-8 space-y-8">
      <AutoRefresh intervalMs={15000} /> {/* Refreshes data every 15 seconds */}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            Overview & Analytics
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </div>
          </h1>
          <p className="text-muted-foreground mt-1">Real-time overview of your real estate marketplace.</p>
        </div>
      </div>

      {/* Core KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Users className="w-5 h-5" /></div>
            <h3 className="font-bold text-muted-foreground">Total Users</h3>
          </div>
          <p className="text-4xl font-black text-foreground">{stats.users}</p>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Building className="w-5 h-5" /></div>
            <h3 className="font-bold text-muted-foreground">Total Agents</h3>
          </div>
          <p className="text-4xl font-black text-foreground">{stats.agents}</p>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><AlertCircle className="w-5 h-5" /></div>
            <h3 className="font-bold text-muted-foreground">Pending Agents</h3>
          </div>
          <p className="text-4xl font-black text-foreground">{stats.pendingAgents}</p>
          {stats.pendingAgents > 0 && (
            <Link href="/admin/agents" className="absolute inset-0 bg-amber-50/50 flex items-center justify-center opacity-0 hover:opacity-100 transition backdrop-blur-sm">
              <span className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold shadow-md">Review Now</span>
            </Link>
          )}
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><FileText className="w-5 h-5" /></div>
            <h3 className="font-bold text-muted-foreground">Properties</h3>
          </div>
          <p className="text-4xl font-black text-foreground">{stats.properties}</p>
        </div>
      </div>

      {/* Advanced Analytics */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Platform Analytics</h2>
        <AdminMetrics />
      </div>
    </div>
  );
}

