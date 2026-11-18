"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Crown, Lock } from "lucide-react";

export function PremiumFeatureGate({
  feature,
  description,
}: {
  feature: string;
  description: string;
}) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm w-full">
        <div className="w-20 h-20 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-8 h-8 text-amber-500" />
        </div>
        <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full mb-4">
          <Crown className="w-3.5 h-3.5" /> Premium Feature
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-3">{feature}</h2>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">{description}</p>
        <Link href="/member/premium" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 font-bold text-sm shadow-lg hover:from-amber-500 hover:to-amber-600 transition-all">
          <Crown className="w-4 h-4" /> Upgrade to Premium — ₦5,000/year
        </Link>
      </motion.div>
    </div>
  );
}
