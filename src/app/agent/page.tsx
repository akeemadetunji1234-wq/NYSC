"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import { PageTransition } from "../../components/layout/PageTransition";
import { 
  Building, 
  CalendarCheck, 
  TrendingUp, 
  Star, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MoreVertical 
} from "lucide-react";
import { Button } from "../../components/ui/button";
import Link from "next/link";

import { getAgentDashboardStats, getAgentBookings, getAgentPropertiesAnalytics } from "../actions/agent";
import { Eye, Bookmark, MessageSquare, BarChart3, Crown, Megaphone, BadgeCheck, ShieldCheck } from "lucide-react";

export default function AgentOverviewPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const userName = (session?.user as any)?.name?.split(" ")[0] || "Agent";

  const [statsData, setStatsData] = useState({
    activeProperties: 0,
    totalBookings: 0,
    totalEarnings: 0,
    avgRating: "0.0",
    reviewCount: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [propertiesAnalytics, setPropertiesAnalytics] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!userId) return;
      try {
        const dashboardStats = await getAgentDashboardStats(userId);
        setStatsData(dashboardStats);
        
        const allBookings = await getAgentBookings(userId);
        setRecentBookings(allBookings.slice(0, 4));

        const analytics = await getAgentPropertiesAnalytics(userId);
        setPropertiesAnalytics(analytics);
      } catch (error) {
        console.error("Failed to fetch real-time agent dashboard data. Database might be unreachable.", error);
      }
    }
    
    loadData();
    // Poll for real-time updates every 15 seconds
    const intervalId = setInterval(loadData, 15000);
    return () => clearInterval(intervalId);
  }, [userId]);

  const stats = [
    { title: "Active Properties", value: statsData.activeProperties.toString(), icon: Building, trend: "Current" },
    { title: "Total Bookings", value: statsData.totalBookings.toString(), icon: CalendarCheck, trend: "All time" },
    { title: "Average Rating", value: statsData.avgRating, icon: Star, trend: `Based on ${statsData.reviewCount} reviews` },
  ];

  const getStatusBadge = (status: string) => {
    switch(status.toUpperCase()) {
      case 'PENDING': return <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium"><Clock className="w-3 h-3"/> Pending</span>;
      case 'ACCEPTED': return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs font-medium"><CheckCircle2 className="w-3 h-3"/> Confirmed</span>;
      case 'COMPLETED': return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium"><CheckCircle2 className="w-3 h-3"/> Completed</span>;
      case 'DECLINED': return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium"><XCircle className="w-3 h-3"/> Declined</span>;
      default: return null;
    }
  }

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            Overview
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </div>
          </h1>
          <p className="text-muted-foreground mt-1">Welcome back, {userName}! Here's what's happening today.</p>
        </div>
          <Link href="/agent/properties">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm">
              <Building className="w-4 h-4 mr-2" /> Add New Property
            </Button>
          </Link>
        </div>

        {/* Premium Quick Actions (Only shows for Premium Agents) */}
        {(session?.user as any)?.isPremium && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: "/agent/properties/boost", label: "Boost Listings", icon: Megaphone, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400" },
              { href: "/agent/analytics", label: "Advanced Analytics", icon: BarChart3, color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400" },
              { href: "/agent/verification", label: "Verified Badge", icon: BadgeCheck, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400" },
              { href: "/agent/support", label: "Priority Support", icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400" },
            ].map((feat, i) => (
              <Link key={i} href={feat.href} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-card/95 backdrop-blur-sm border border-blue-600/20 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-blue-500/50 transition-all duration-300 ease-out group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feat.color} group-hover:scale-110 transition-transform`}>
                  <feat.icon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-xs text-foreground text-center">{feat.label}</p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-1">
                  <Crown className="w-2.5 h-2.5" /> Premium
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-card/95 backdrop-blur-sm p-6 rounded-2xl border border-border/50 shadow-sm flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 duration-300 ease-out transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/20 rounded-xl flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                <p className="text-sm font-medium text-muted-foreground mt-1">{stat.title}</p>
                <p className="text-xs text-slate-400 mt-2">{stat.trend}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Bookings */}
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Recent Bookings</h2>
              <Link href="/agent/bookings" className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</Link>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary text-muted-foreground font-medium">
                  <tr>
                    <th className="px-6 py-4">Guest</th>
                    <th className="px-6 py-4">Property</th>
                    <th className="px-6 py-4">Dates</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentBookings.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No bookings found.</td></tr>
                  ) : recentBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-secondary transition">
                      <td className="px-6 py-4 font-medium text-foreground">{booking.corpMember?.name || "Guest"}</td>
                      <td className="px-6 py-4 text-muted-foreground">{booking.property?.title}</td>
                      <td className="px-6 py-4 text-muted-foreground">{new Date(booking.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">{getStatusBadge(booking.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Tips / Notices */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-sm p-6 text-white flex flex-col justify-between relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-10">
               <Star className="w-32 h-32" />
             </div>
             <div className="relative z-10">
               <h3 className="text-xl font-bold mb-2">Boost Your Rankings</h3>
               <p className="text-blue-100 text-sm leading-relaxed mb-6">
                 Properties with high-quality photos and detailed descriptions receive 40% more booking requests from corpers.
               </p>
               <Button className="bg-card text-blue-700 hover:bg-blue-50 w-full rounded-xl shadow-sm">
                 Update Listings
               </Button>
             </div>
             <div className="relative z-10 mt-6 pt-6 border-t border-blue-500/30">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-blue-500/50 flex items-center justify-center shrink-0">
                    <CalendarCheck className="w-5 h-5 text-blue-100" />
                 </div>
                 <div>
                   <p className="text-sm font-semibold">Camp Orientation Starts Soon</p>
                   <p className="text-xs text-blue-200">Prepare for high demand next month.</p>
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Listing Performance Analytics */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Listing Performance (Last 30 Days)</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Track how users interact with your active listings.</p>
            </div>
          </div>

          {propertiesAnalytics.length === 0 ? (
            <p className="text-center py-6 text-sm text-muted-foreground">No active properties to track performance metrics.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {propertiesAnalytics.map((prop) => {
                const maxVal = Math.max(prop.views, 1);
                return (
                  <div key={prop.id} className="p-4 rounded-xl border border-border bg-secondary/30 space-y-4 hover:border-blue-200 transition">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-sm text-foreground truncate max-w-[70%]">{prop.title}</h4>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {prop.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {/* Views */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Eye className="w-3.5 h-3.5 text-slate-400" /> Views
                        </div>
                        <p className="text-lg font-bold text-foreground">{prop.views}</p>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: "100%" }}></div>
                        </div>
                      </div>

                      {/* Saves */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Bookmark className="w-3.5 h-3.5 text-slate-400" /> Bookmarks
                        </div>
                        <p className="text-lg font-bold text-foreground">{prop.saves}</p>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(prop.saves / maxVal) * 100}%` }}></div>
                        </div>
                      </div>

                      {/* Inquiries */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Inquiries
                        </div>
                        <p className="text-lg font-bold text-foreground">{prop.inquiries}</p>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(prop.inquiries / maxVal) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
