"use client";

import { useState, useEffect } from "react";
import { Users, TrendingUp, Handshake } from "lucide-react";
import { motion } from "motion/react";
import { Skeleton } from "../../components/ui/skeleton";

export function AdminMetrics() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <Skeleton className="h-4 w-32 mb-6" />
            <Skeleton className="h-10 w-24 mb-4" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
      >
        <h3 className="text-sm font-medium text-slate-500 mb-4">
          Verification Health
        </h3>
        <div className="flex items-end justify-between mb-2">
          <span className="text-3xl font-bold text-slate-900">94%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-emerald-500 rounded-full"
            style={{ width: "94%" }}
          ></div>
        </div>
        <p className="text-sm text-slate-500">Processing within 24h SLA</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-sm font-medium text-slate-500">
            Total Verified Agents
          </h3>
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-2">1,240</div>
        <div className="flex items-center gap-1 text-sm text-emerald-600 font-medium">
          <TrendingUp className="w-4 h-4" />
          <span>+12 this week</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-sm font-medium text-slate-500">
            Platform Partnerships
          </h3>
          <div className="p-2 bg-blue-50 rounded-lg">
            <Handshake className="w-4 h-4 text-blue-600" />
          </div>
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-2">15</div>
        <p className="text-sm text-slate-500">3 pending review</p>
      </motion.div>
    </div>
  );
}
