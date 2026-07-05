"use client";
import { PageTransition } from "../../../components/layout/PageTransition";
import { Users, TrendingUp, DollarSign, Activity, ShieldCheck, Home } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { getDashboardStats } from "../../actions/admin";

const chartData = [
  { name: "Mon", revenue: 4000, users: 240 },
  { name: "Tue", revenue: 3000, users: 139 },
  { name: "Wed", revenue: 2000, users: 980 },
  { name: "Thu", revenue: 2780, users: 390 },
  { name: "Fri", revenue: 1890, users: 480 },
  { name: "Sat", revenue: 2390, users: 380 },
  { name: "Sun", revenue: 3490, users: 430 },
];

export default function OverviewPage() {
  const [stats, setStats] = useState({ users: 0, agents: 0, pendingAgents: 0, properties: 0 });

  useEffect(() => {
    async function loadStats() {
      const data = await getDashboardStats();
      setStats({
        users: data.users,
        agents: data.agents,
        pendingAgents: data.pendingAgents,
        properties: data.properties
      });
    }
    loadStats();
  }, []);
  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Overview</h1>
          <p className="text-muted-foreground mt-1">High-level metrics and recent activity across Neat & Affordable.</p>
        </div>

        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Users</h3>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-2">{stats.users}</div>
            <p className="text-sm text-muted-foreground">Registered platform users</p>
          </div>

          <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Agents</h3>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-2">{stats.agents}</div>
            <p className="text-sm text-muted-foreground">Total agent accounts</p>
          </div>

          <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Pending Agents</h3>
              <div className="p-2 bg-amber-50 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-2">{stats.pendingAgents}</div>
            <p className="text-sm text-muted-foreground">Needs verification review</p>
          </div>

          <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Properties</h3>
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Home className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground mb-2">{stats.properties}</div>
            <p className="text-sm text-muted-foreground">Total listed properties</p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <h3 className="text-lg font-bold text-foreground mb-6">Revenue vs User Growth</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#008A4B" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
                <Line yAxisId="right" type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
