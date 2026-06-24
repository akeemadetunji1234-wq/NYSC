"use client";

import { PageTransition } from "../../../components/layout/PageTransition";
import { TrendingUp, Users, Home, Activity, Download, Calendar } from "lucide-react";
import { Button } from "../../../components/ui/button";

export default function AnalyticsPage() {
  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Platform Analytics</h1>
            <p className="text-slate-500 mt-1">Track key performance metrics and user growth.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white rounded-xl">
               <Calendar className="w-4 h-4 mr-2" /> Last 30 Days
            </Button>
            <Button className="bg-[#008A4B] hover:bg-[#006F3C] text-white rounded-xl">
               <Download className="w-4 h-4 mr-2" /> Export Report
            </Button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-blue-50 rounded-xl">
                 <Users className="w-6 h-6 text-blue-600" />
               </div>
               <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md flex items-center">
                 <TrendingUp className="w-3 h-3 mr-1" /> +12%
               </span>
             </div>
             <p className="text-sm font-medium text-slate-500">Total Users</p>
             <h3 className="text-2xl font-bold text-slate-900 mt-1">14,205</h3>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-indigo-50 rounded-xl">
                 <Home className="w-6 h-6 text-indigo-600" />
               </div>
               <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md flex items-center">
                 <TrendingUp className="w-3 h-3 mr-1" /> +5%
               </span>
             </div>
             <p className="text-sm font-medium text-slate-500">Listed Properties</p>
             <h3 className="text-2xl font-bold text-slate-900 mt-1">3,842</h3>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-emerald-50 rounded-xl">
                 <Activity className="w-6 h-6 text-emerald-600" />
               </div>
               <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md flex items-center">
                 <TrendingUp className="w-3 h-3 mr-1" /> +24%
               </span>
             </div>
             <p className="text-sm font-medium text-slate-500">Active Bookings</p>
             <h3 className="text-2xl font-bold text-slate-900 mt-1">1,405</h3>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-amber-50 rounded-xl">
                 <TrendingUp className="w-6 h-6 text-amber-600" />
               </div>
               <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md flex items-center">
                 <TrendingUp className="w-3 h-3 mr-1" /> +18%
               </span>
             </div>
             <p className="text-sm font-medium text-slate-500">Platform Revenue</p>
             <h3 className="text-2xl font-bold text-slate-900 mt-1">₦4.2M</h3>
          </div>
        </div>

        {/* Charts/Reports Placeholders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[400px] flex flex-col">
             <h3 className="font-bold text-slate-900 mb-6">Revenue Growth</h3>
             <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400">
                [ Line Chart Placeholder ]
             </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[400px] flex flex-col">
             <h3 className="font-bold text-slate-900 mb-6">User Demographics</h3>
             <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400">
                [ Pie Chart Placeholder ]
             </div>
          </div>
        </div>
        
        {/* Recent Activity Table Placeholder */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Recent Platform Activity</h3>
           </div>
           <div className="p-6 text-center text-slate-500 border-2 border-dashed border-slate-200 m-6 rounded-xl bg-slate-50">
              [ Activity Logs Table ]
           </div>
        </div>

      </div>
    </PageTransition>
  );
}
