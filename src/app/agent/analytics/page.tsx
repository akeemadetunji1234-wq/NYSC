"use client";

import { useState, useEffect } from "react";
import { PageTransition } from "../../../components/layout/PageTransition";
import { BarChart3, TrendingUp, Eye, Bookmark, MessageSquare, CalendarCheck, RefreshCw } from "lucide-react";
import { getAgentPropertiesAnalytics } from "../../actions/agent";
import { Button } from "../../../components/ui/button";
import { toast } from "sonner";

interface PropertyAnalytics {
  id: string;
  title: string;
  status: string;
  views: number;
  saves: number;
  inquiries: number;
  bookings: number;
  conversionRate: number;
  isBoosted: boolean;
  boostedUntil: string | Date | null;
}

export default function AdvancedAnalyticsPage() {
  const [analytics, setAnalytics] = useState<PropertyAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadStats = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await getAgentPropertiesAnalytics();
      setAnalytics(data as PropertyAnalytics[]);
      setLastUpdated(new Date());
    } catch (error: any) {
      if (!silent) toast.error(error.message || "Failed to fetch analytics");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(() => loadStats(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const totals = analytics.reduce((sum, p) => ({
    views: sum.views + p.views,
    saves: sum.saves + p.saves,
    inquiries: sum.inquiries + p.inquiries,
    bookings: sum.bookings + p.bookings,
  }), { views: 0, saves: 0, inquiries: 0, bookings: 0 });
  const conversionRate = totals.views > 0 ? ((totals.inquiries / totals.views) * 100).toFixed(1) : "0.0";

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              Performance Analytics <BarChart3 className="w-6 h-6 text-purple-600" />
            </h1>
            <p className="text-muted-foreground mt-1">Live views, saves, inquiries, bookings, and conversion performance for your listings.</p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && <span className="text-xs text-muted-foreground">Updated {lastUpdated.toLocaleTimeString()}</span>}
            <Button variant="outline" size="sm" onClick={() => loadStats()} disabled={isLoading} className="gap-2">
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Total Views", value: totals.views, icon: Eye, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
            { label: "Total Saves", value: totals.saves, icon: Bookmark, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" },
            { label: "Inquiries", value: totals.inquiries, icon: MessageSquare, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
            { label: "Bookings", value: totals.bookings, icon: CalendarCheck, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" },
            { label: "Conversion Rate", value: `${conversionRate}%`, icon: TrendingUp, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30" },
          ].map((stat) => (
            <div key={stat.label} className="p-5 bg-card rounded-2xl border border-border shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${stat.color}`}><stat.icon className="w-5 h-5" /></div>
              <h3 className="text-2xl font-bold text-foreground">{typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}</h3>
              <p className="text-sm font-medium text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Listing Performance</h2>
              <p className="text-xs text-muted-foreground mt-1">Metrics are read from live property, save, inquiry, and booking records.</p>
            </div>
            <span className="text-xs font-bold text-emerald-600">Auto-refresh: 15s</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4">Listing</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Views</th>
                  <th className="p-4">Saves</th>
                  <th className="p-4">Inquiries</th>
                  <th className="p-4">Bookings</th>
                  <th className="p-4">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading live metrics...</td></tr>
                ) : analytics.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No listings found.</td></tr>
                ) : analytics.map((property) => (
                  <tr key={property.id} className="hover:bg-secondary/30 transition">
                    <td className="p-4 font-semibold text-foreground max-w-xs truncate">{property.title}</td>
                    <td className="p-4"><span className="text-xs font-bold uppercase text-muted-foreground">{property.status}</span></td>
                    <td className="p-4 font-medium text-foreground">{property.views.toLocaleString()}</td>
                    <td className="p-4 font-medium text-foreground">{property.saves.toLocaleString()}</td>
                    <td className="p-4 font-medium text-foreground">{property.inquiries.toLocaleString()}</td>
                    <td className="p-4 font-medium text-foreground">{property.bookings.toLocaleString()}</td>
                    <td className="p-4 font-bold text-purple-600">{property.conversionRate.toFixed(2)}%</td>
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
