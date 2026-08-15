"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, Crown, Zap, Shield, BarChart2, Star, ImageIcon, Bell, ArrowLeft } from "lucide-react";

const FREE_FEATURES = [
  { label: "List up to 5 properties", included: true },
  { label: "Basic agent profile", included: true },
  { label: "Receive booking & viewing requests", included: true },
  { label: "In-app messaging with corpers", included: true },
  { label: "List up to 15 properties", included: false },
  { label: "Featured / Boosted listings (top of search)", included: false },
  { label: "Premium Agent plan badge", included: false },
  { label: "Property Analytics Dashboard", included: false },
  { label: "Instant interest alerts (WhatsApp/Push)", included: false },
  { label: "Priority Customer Support", included: false },
];

const PREMIUM_FEATURES = [
  { label: "Everything in Free", included: true },
  { label: "🏠 List up to 15 properties", included: true },
  { label: "🚀 Featured / Boosted listings (top of search)", included: true },
  { label: "👑 Premium Agent plan badge on eligible listings", included: true },
  { label: "📊 Property Analytics Dashboard", included: true },
  { label: "🔔 Instant interest alerts (WhatsApp/Push)", included: true },
  { label: "🌟 Priority Customer Support", included: true },
];

export default function AgentPremiumPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isPremium = Boolean(user?.isPremium && user?.premiumPlan === "AGENT_PREMIUM" && (!user?.premiumExpiry || new Date(user.premiumExpiry).getTime() > Date.now()));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/20">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/agent/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          {isPremium ? (
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-4 py-1.5 rounded-full mb-5">
              <Crown className="w-3.5 h-3.5" />
              Premium Agent — Active
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-4 py-1.5 rounded-full mb-5">
              <Zap className="w-3.5 h-3.5" />
              Grow your listing business
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            List more. Earn more.<br />
            <span className="text-amber-600">Agent Premium</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Premium agents close more deals. Get your listings seen first by thousands of corp members every batch cycle.
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-14">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm"
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Free Agent</h2>
              <p className="text-muted-foreground text-sm">Great for getting started</p>
              <div className="mt-4">
                <span className="text-4xl font-black text-gray-900">₦0</span>
                <span className="text-muted-foreground text-sm ml-1">/month</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  {f.included ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                  )}
                  <span className={`text-sm ${f.included ? "text-gray-700" : "text-slate-400"}`}>{f.label}</span>
                </li>
              ))}
            </ul>
            <div className="w-full py-3 rounded-2xl border-2 border-slate-200 text-center text-sm font-semibold text-slate-400 cursor-default">
              {isPremium ? "Previous Plan" : "Current Plan"}
            </div>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl border border-amber-600 p-8 shadow-xl relative overflow-hidden"
          >
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />

            <div className="relative mb-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold text-white">Premium Agent</h2>
                <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full border border-white/30">
                  <Crown className="w-3 h-3" />
                  TOP TIER
                </span>
              </div>
              <p className="text-amber-100 text-sm">Maximum reach. Maximum earnings.</p>
              <div className="mt-4">
                <span className="text-4xl font-black text-white">₦10,000</span>
                <span className="text-amber-200 text-sm ml-1">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8 relative">
              {PREMIUM_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-200 mt-0.5 shrink-0" />
                  <span className="text-sm text-white/90">{f.label}</span>
                </li>
              ))}
            </ul>

            {isPremium ? (
              <div className="relative w-full py-3 rounded-2xl bg-white/20 border border-white/30 text-center text-sm font-bold text-white">
                ✅ Premium Active — expires {user?.premiumExpiry ? new Date(user.premiumExpiry).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) : "—"}
              </div>
            ) : (
              <div className="relative w-full py-3 rounded-2xl bg-white text-amber-700 text-center text-sm font-bold shadow-lg cursor-default">
                Pay ₦10,000/month — Go Premium Agent 👑
              </div>
            )}
          </motion.div>
        </div>

        {/* Payment Instructions */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 mb-10"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              How to Upgrade
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Premium pricing is ₦10,000/month. Premium activation is currently handled by an administrator.
            </p>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
              <p className="font-semibold">Payment instructions are not published in the app.</p>
              <p className="mt-1 text-sm leading-relaxed">Do not transfer money using unverified account details. Contact the Neat &amp; Affordable administrators through an approved support channel for current payment and activation instructions.</p>
            </div>
          </motion.div>
        )}

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          {[
            { icon: Star, title: "Boosted Listings", desc: "Your properties show at the top of every search result", color: "bg-amber-50 text-amber-600" },
            { icon: BarChart2, title: "Analytics Dashboard", desc: "Track views, clicks, and interest on every listing", color: "bg-blue-50 text-blue-600" },
            { icon: Bell, title: "Instant Alerts", desc: "Get notified through in-app and Pusher alerts when a corper is interested", color: "bg-emerald-50 text-emerald-600" },
            { icon: Crown, title: "Premium Badge", desc: "Stand out with a premium plan badge on eligible listings", color: "bg-purple-50 text-purple-600" },
            { icon: ImageIcon, title: "15 Listings", desc: "List 3× more properties compared to the free plan", color: "bg-rose-50 text-rose-600" },
            { icon: Shield, title: "Lead CRM", desc: "Track enquiries from first contact to booking", color: "bg-slate-50 text-slate-600" },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 text-center shadow-sm">
              <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-3`}>
                <item.icon className="w-5 h-5" />
              </div>
              <p className="font-bold text-gray-900 text-sm mb-1">{item.title}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
