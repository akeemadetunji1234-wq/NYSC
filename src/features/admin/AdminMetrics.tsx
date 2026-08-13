"use client";

import { useState, useEffect } from "react";
import { Users, TrendingUp, DollarSign } from "lucide-react";
import { motion } from "motion/react";
import { Skeleton } from "../../components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";

// Simulated real-time data
const generateRevenueData = () => [
  { name: "Mon", revenue: Math.floor(Math.random() * 50000) + 100000 },
  { name: "Tue", revenue: Math.floor(Math.random() * 50000) + 120000 },
  { name: "Wed", revenue: Math.floor(Math.random() * 50000) + 110000 },
  { name: "Thu", revenue: Math.floor(Math.random() * 50000) + 140000 },
  { name: "Fri", revenue: Math.floor(Math.random() * 50000) + 180000 },
  { name: "Sat", revenue: Math.floor(Math.random() * 50000) + 200000 },
  { name: "Sun", revenue: Math.floor(Math.random() * 50000) + 190000 },
];

const generatePropertyData = () => [
  { name: "Week 1", listed: Math.floor(Math.random() * 20) + 50, booked: Math.floor(Math.random() * 10) + 30 },
  { name: "Week 2", listed: Math.floor(Math.random() * 20) + 55, booked: Math.floor(Math.random() * 10) + 35 },
  { name: "Week 3", listed: Math.floor(Math.random() * 20) + 60, booked: Math.floor(Math.random() * 10) + 40 },
  { name: "Week 4", listed: Math.floor(Math.random() * 20) + 70, booked: Math.floor(Math.random() * 10) + 45 },
];

export function AdminMetrics() {
  const [isLoading, setIsLoading] = useState(true);
  const [revenueData, setRevenueData] = useState(generateRevenueData());
  const [propertyData, setPropertyData] = useState(generatePropertyData());

  useEffect(() => {
    setIsLoading(false);

    // Simulate real-time data updates every 5 seconds
    const interval = setInterval(() => {
      setRevenueData(generateRevenueData());
      setPropertyData(generatePropertyData());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card p-6 rounded-2xl shadow-sm border border-border">
              <Skeleton className="h-4 w-32 mb-6" />
              <Skeleton className="h-10 w-24 mb-4" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card p-6 rounded-2xl shadow-sm border border-border"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Weekly Revenue</h3>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground mb-2">₦940,500</div>
          <div className="flex items-center gap-1 text-sm text-emerald-600 font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>+14.5% vs last week</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card p-6 rounded-2xl shadow-sm border border-border"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Verified Agents</h3>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground mb-2">1,240</div>
          <div className="flex items-center gap-1 text-sm text-emerald-600 font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>+12 this week</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card p-6 rounded-2xl shadow-sm border border-border"
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Verification Health</h3>
          <div className="flex items-end justify-between mb-2">
            <span className="text-3xl font-bold text-foreground">94%</span>
          </div>
          <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden mb-3">
            <div className="h-full bg-[#008A4B] rounded-full transition-all duration-1000" style={{ width: "94%" }}></div>
          </div>
          <p className="text-sm text-muted-foreground">Processing within 24h SLA</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card p-6 rounded-2xl shadow-sm border border-border"
        >
          <h3 className="text-lg font-bold text-foreground mb-6">Revenue Overview (Live)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#008A4B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#008A4B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }} 
                  tickFormatter={(val) => `₦${val / 1000}k`}
                  width={60}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#008A4B" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card p-6 rounded-2xl shadow-sm border border-border"
        >
          <h3 className="text-lg font-bold text-foreground mb-6">Property Listings vs Bookings (Live)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={propertyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} width={40} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="listed" name="Properties Listed" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={24} animationDuration={1500} />
                <Bar dataKey="booked" name="Properties Booked" fill="#008A4B" radius={[4, 4, 0, 0]} barSize={24} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
