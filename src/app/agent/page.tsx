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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";

export default function AgentOverviewPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const userName = (session?.user as any)?.name?.split(" ")[0] || "Agent";

  const [statsData, setStatsData] = useState({
    activeProperties: 0,
    totalBookings: 0,
    confirmedExternalPaymentValue: 0,
    confirmedExternalPaymentCount: 0,
    avgRating: "0.0",
    reviewCount: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [propertiesAnalytics, setPropertiesAnalytics] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!userId) return;
      try {
        const dashboardStats = await getAgentDashboardStats();
        setStatsData(dashboardStats);
        
        const allBookings = await getAgentBookings();
        setRecentBookings(allBookings.slice(0, 4));

        const analytics = await getAgentPropertiesAnalytics();
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
      case 'COMPLETED': return <span className="flex items-center gap-1 text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-950/40 px-2 py-1 rounded-full text-xs font-medium"><CheckCircle2 className="w-3 h-3"/> Completed</span>;
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
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </div>
          </h1>
          <p className="text-muted-foreground mt-1">Welcome back, {userName}! Here's what's happening today.</p>
        </div>
          <Link href="/agent/properties">
            <Button className="na-brand-surface hover:brightness-95 text-white rounded-xl shadow-sm">
              <Building className="w-4 h-4 mr-2" /> Add New Property
            </Button>
          </Link>
        </div>

        {/* Premium Quick Actions (Only shows for Premium Agents) */}
        {(() => { const premiumUser = session?.user as any; const activeAgentPremium = Boolean(premiumUser?.isPremium && premiumUser?.premiumPlan === "AGENT_PREMIUM" && (!premiumUser?.premiumExpiry || new Date(premiumUser.premiumExpiry) > new Date())); return activeAgentPremium; })() && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: "/agent/properties/boost", label: "Boost Listings", icon: Megaphone, color: "na-brand-text na-brand-soft" },
              { href: "/agent/analytics", label: "Advanced Analytics", icon: BarChart3, color: "na-brand-text na-surface" },
              { href: "/agent/leads", label: "Lead CRM", icon: MessageSquare, color: "na-brand-text na-brand-soft" },
              { href: "/agent/verification", label: "Verified Badge", icon: BadgeCheck, color: "na-brand-text na-surface" },
              { href: "/agent/support", label: "Priority Support", icon: ShieldCheck, color: "na-brand-text na-brand-soft" },
            ].map((feat, i) => (
              <Link key={i} href={feat.href} className="na-card flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-[var(--na-border-soft)] shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[var(--na-brand)] transition-all duration-300 ease-out group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feat.color} group-hover:scale-110 transition-transform`}>
                  <feat.icon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-xs text-foreground text-center">{feat.label}</p>
                <div className="flex items-center gap-1 text-[10px] font-bold na-brand-text na-brand-soft px-2 py-0.5 rounded-full mt-1">
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
                <div className="w-12 h-12 na-brand-soft rounded-xl flex items-center justify-center">
                  <stat.icon className="w-6 h-6 na-brand-text" />
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
              <Link href="/agent/bookings" className="text-sm font-medium na-brand-text hover:underline">View All</Link>
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
          <div className="na-brand-surface rounded-2xl shadow-sm p-6 text-white flex flex-col justify-between relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-10">
               <Star className="w-32 h-32" />
             </div>
             <div className="relative z-10">
               <h3 className="text-xl font-bold mb-2">Improve Your Listings</h3>
               <p className="text-white/80 text-sm leading-relaxed mb-6">
                 Keep availability, pricing, photos, and descriptions current so members can make informed decisions.
               </p>
               <Link href="/agent/properties">
                 <Button className="bg-white text-[var(--na-brand)] hover:bg-white/90 w-full rounded-xl shadow-sm">
                   Update Listings
                 </Button>
               </Link>
             </div>
             <div className="relative z-10 mt-6 pt-6 border-t border-white/20">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                    <CalendarCheck className="w-5 h-5 text-white/85" />
                 </div>
                 <div>
                   <p className="text-sm font-semibold">Camp Orientation Starts Soon</p>
                   <p className="text-xs text-white/70">Prepare for high demand next month.</p>
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Listing Performance Analytics */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-2.5 na-brand-soft rounded-xl">
              <BarChart3 className="w-5 h-5 na-brand-text" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Listing Performance</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Live lifetime totals from published and draft listings.</p>
            </div>
          </div>

          {propertiesAnalytics.length === 0 ? (
            <p className="text-center py-6 text-sm text-muted-foreground">No active properties to track performance metrics.</p>
          ) : (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={propertiesAnalytics} margin={{ top: 20, right: 30, left: 0, bottom: 20 }} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="title" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#6b7280' }} 
                    dy={10} 
                    tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} width={40} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="views" name="Profile Views" fill="var(--na-brand)" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1500} />
                  <Bar dataKey="saves" name="Bookmarks" fill="#35c875" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1500} />
                  <Bar dataKey="inquiries" name="Inquiries" fill="#a8b9ad" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
