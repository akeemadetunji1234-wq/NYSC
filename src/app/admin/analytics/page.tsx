"use client";

import { PageTransition } from "../../../components/layout/PageTransition";
import { TrendingUp, Users, Home, Activity, Download, Calendar } from "lucide-react";
import { Button } from "../../../components/ui/button";

import { useState, useEffect } from "react";
import { getRegionalHeatmapData } from "../../actions/admin";
import { toast } from "sonner";

export default function AnalyticsPage() {
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getRegionalHeatmapData();
        setHeatmap(data);
      } catch (err) {
        toast.error("Failed to load regional analytics");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Critical Shortage":
        return "bg-red-500/10 text-red-600 border border-red-500/20";
      case "Undersupplied":
        return "bg-amber-500/10 text-amber-600 border border-amber-500/20";
      case "Oversupplied":
        return "bg-blue-500/10 text-blue-600 border border-blue-500/20";
      default:
        return "bg-green-500/10 text-green-600 border border-green-500/20";
    }
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Platform Analytics</h1>
            <p className="text-muted-foreground mt-1">Track key performance metrics and user growth.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-card rounded-xl">
               <Calendar className="w-4 h-4 mr-2" /> Last 30 Days
            </Button>
            <Button className="bg-[#008A4B] hover:bg-[#006F3C] text-white rounded-xl">
               <Download className="w-4 h-4 mr-2" /> Export Report
            </Button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
             <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
                 <Users className="w-6 h-6 text-blue-600" />
               </div>
               <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-md flex items-center">
                 <TrendingUp className="w-3 h-3 mr-1" /> +12%
               </span>
             </div>
             <p className="text-sm font-medium text-muted-foreground">Total Users</p>
             <h3 className="text-2xl font-bold text-foreground mt-1">14,205</h3>
          </div>
          
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
             <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl">
                 <Home className="w-6 h-6 text-indigo-600" />
               </div>
               <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-md flex items-center">
                 <TrendingUp className="w-3 h-3 mr-1" /> +5%
               </span>
             </div>
             <p className="text-sm font-medium text-muted-foreground">Listed Properties</p>
             <h3 className="text-2xl font-bold text-foreground mt-1">3,842</h3>
          </div>
          
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
             <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl">
                 <Activity className="w-6 h-6 text-emerald-600" />
               </div>
               <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-md flex items-center">
                 <TrendingUp className="w-3 h-3 mr-1" /> +24%
               </span>
             </div>
             <p className="text-sm font-medium text-muted-foreground">Active Bookings</p>
             <h3 className="text-2xl font-bold text-foreground mt-1">1,405</h3>
          </div>
          
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
             <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl">
                 <TrendingUp className="w-6 h-6 text-amber-600" />
               </div>
               <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-md flex items-center">
                 <TrendingUp className="w-3 h-3 mr-1" /> +18%
               </span>
             </div>
             <p className="text-sm font-medium text-muted-foreground">Platform Revenue</p>
             <h3 className="text-2xl font-bold text-foreground mt-1">₦4.2M</h3>
          </div>
        </div>

        {/* Heatmap & Demographics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card p-6 rounded-2xl shadow-sm border border-border min-h-[400px] flex flex-col">
             <h3 className="font-bold text-foreground mb-6">Revenue Growth</h3>
             <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-xl bg-secondary/30 text-slate-400">
                [ Line Chart Placeholder ]
             </div>
          </div>
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-border min-h-[400px] flex flex-col">
             <div className="mb-4">
               <h3 className="font-bold text-foreground">Regional Demand Heatmap</h3>
               <p className="text-xs text-muted-foreground mt-0.5">Compares Corper PPAs (Demand) to Listed Properties (Supply) by LGA.</p>
             </div>
             
             <div className="flex-1 overflow-y-auto max-h-[320px] pr-1 space-y-3">
                {isLoading ? (
                  <p className="text-center py-8 text-xs text-muted-foreground">Loading regional statistics...</p>
                ) : heatmap.length === 0 ? (
                  <p className="text-center py-8 text-xs text-muted-foreground">No regional data available.</p>
                ) : (
                  heatmap.map((region, idx) => (
                    <div key={idx} className="p-3 bg-secondary/30 rounded-xl border border-border flex items-center justify-between text-xs hover:border-blue-200 transition">
                      <div className="space-y-0.5 max-w-[50%]">
                        <p className="font-bold text-foreground truncate">{region.lga}</p>
                        <p className="text-[10px] text-muted-foreground">{region.state} State</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium text-foreground"><span className="text-blue-600 font-bold">{region.demand}</span> PPA / <span className="text-slate-500 font-bold">{region.supply}</span> Lodges</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5">Ratio: {region.ratio}x</p>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(region.status)}`}>
                          {region.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
        
        {/* Recent Activity Table Placeholder */}
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
           <div className="p-6 border-b border-border">
              <h3 className="font-bold text-foreground">Recent Platform Activity</h3>
           </div>
           <div className="p-6 text-center text-muted-foreground border border-dashed border-border m-6 rounded-xl bg-secondary">
              [ Activity Logs Table ]
           </div>
        </div>

      </div>
    </PageTransition>
  );
}
