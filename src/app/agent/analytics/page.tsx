"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PageTransition } from "../../../components/layout/PageTransition";
import { BarChart3, TrendingUp, Users, Eye, ArrowUpRight, Bookmark, MessageSquare } from "lucide-react";
import { getAgentPropertiesAnalytics } from "../../actions/agent";

export default function AdvancedAnalyticsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const [stats, setStats] = useState({ views: 0, saves: 0, inquiries: 0 });

  useEffect(() => {
    async function loadStats() {
      if (!userId) return;
      try {
        const analytics = await getAgentPropertiesAnalytics(userId);
        let totalViews = 0;
        let totalSaves = 0;
        let totalInquiries = 0;
        analytics.forEach((p: any) => {
          totalViews += p.views;
          totalSaves += p.saves;
          totalInquiries += p.inquiries;
        });
        setStats({ views: totalViews, saves: totalSaves, inquiries: totalInquiries });
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      }
    }
    loadStats();
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, [userId]);

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              Advanced Analytics
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </h1>
            <p className="text-muted-foreground mt-1">Deep dive into your property performance and user engagement.</p>
          </div>
          <select className="px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600/20">
            <option>Last 30 Days</option>
            <option>Last 3 Months</option>
            <option>This Year</option>
          </select>
        </div>

        {/* Top level stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Views", val: stats.views.toLocaleString(), trend: "Live", icon: Eye, color: "blue" },
            { label: "Total Bookmarks", val: stats.saves.toLocaleString(), trend: "Live", icon: Bookmark, color: "emerald" },
            { label: "Total Inquiries", val: stats.inquiries.toLocaleString(), trend: "Live", icon: MessageSquare, color: "amber" },
            { label: "Conversion Rate", val: stats.views > 0 ? ((stats.inquiries / stats.views) * 100).toFixed(1) + "%" : "0.0%", trend: "Live", icon: TrendingUp, color: "purple" },
          ].map((stat, i) => (
            <div key={i} className="p-6 bg-card rounded-2xl border border-border shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 flex items-center gap-1`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  {stat.trend}
                </div>
              </div>
              <h3 className="text-3xl font-bold text-foreground">{stat.val}</h3>
              <p className="text-sm font-medium text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Charts Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm min-h-[300px] flex flex-col">
            <h3 className="text-lg font-bold text-foreground mb-4">Traffic Sources</h3>
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 font-medium">
              [ Interactive Chart Placeholder ]
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm min-h-[300px] flex flex-col">
            <h3 className="text-lg font-bold text-foreground mb-4">Viewer Demographics</h3>
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 font-medium">
              [ Interactive Demographics Placeholder ]
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
