"use client";

import { useSession } from "next-auth/react";
import { CheckCircle2, XCircle, Crown, Zap, Shield, Bell, Wifi, MapPin, Wrench, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";

const FREE_FEATURES = [
  { label: "Browse & search all listings", included: true },
  { label: "Contact verified agents", included: true },
  { label: "Save & bookmark properties", included: true },
  { label: "View commute distance estimator", included: true },
  { label: "App notifications for new listings", included: false },
  { label: "Offline / Low Data Mode", included: false },
  { label: "Transport Route Guides", included: false },
  { label: "Maintenance & Artisan Directory", included: false },
];

const PREMIUM_FEATURES = [
  { label: "Everything in Free", included: true },
  { label: "🔔 App notifications for new listings", included: true },
  { label: "📶 Offline / Low Data Mode", included: true },
  { label: "🚍 Transport Route Guides", included: true },
  { label: "🔧 Maintenance & Artisan Directory", included: true },
  { label: "Priority Customer Support", included: true },
  { label: "👑 Premium Member Badge", included: true },
];

const BANK_DETAILS = {
  bank: "First Bank Nigeria",
  accountName: "Neat & Affordable Ltd",
  accountNumber: "3012345678",
};

export default function MemberPremiumPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const isPremium = user?.isPremium;

  const handleRefreshSession = async () => {
    await update();
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Sticky Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/member"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
          {/* Refresh session button — tells user to click this after admin upgrades them */}
          <button
            onClick={handleRefreshSession}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#008A4B] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check Premium Status</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">

        {/* Premium Active Banner */}
        {isPremium && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-lg"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-amber-900 text-sm">You&apos;re a Premium Member! 🎉</p>
              <p className="text-amber-800 text-xs mt-0.5">
                Premium active
                {user?.premiumExpiry
                  ? ` until ${new Date(user.premiumExpiry).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}`
                  : ""}
                . All 4 premium features are unlocked for you.
              </p>
            </div>
          </motion.div>
        )}

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 md:mb-14"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-4 py-1.5 rounded-full mb-4">
            <Zap className="w-3.5 h-3.5" />
            {isPremium ? "Your Premium Plan" : "Upgrade your experience"}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-3 md:mb-4 leading-tight">
            Get more from<br />
            <span className="text-[#008A4B]">Neat & Affordable</span>
          </h1>
          <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto px-2">
            Premium unlocks powerful tools that help you find the perfect apartment faster, smarter, and with less stress.
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 mb-10 md:mb-14">

          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm"
          >
            <div className="mb-5 md:mb-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Free Plan</h2>
              <p className="text-muted-foreground text-sm">Everything you need to get started</p>
              <div className="mt-3 md:mt-4">
                <span className="text-3xl md:text-4xl font-black text-gray-900">₦0</span>
                <span className="text-muted-foreground text-sm ml-1">/month</span>
              </div>
            </div>
            <ul className="space-y-2.5 md:space-y-3 mb-6 md:mb-8">
              {FREE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  {f.included
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    : <XCircle className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />}
                  <span className={`text-sm leading-snug ${f.included ? "text-gray-700" : "text-slate-400"}`}>{f.label}</span>
                </li>
              ))}
            </ul>
            <div className="w-full py-2.5 md:py-3 rounded-xl md:rounded-2xl border-2 border-slate-200 text-center text-sm font-semibold text-slate-400 cursor-default">
              {isPremium ? "Previous Plan" : "Current Plan"}
            </div>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-[#008A4B] to-[#005F33] rounded-2xl md:rounded-3xl border border-emerald-700 p-6 md:p-8 shadow-xl relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-white/5 rounded-full blur-xl pointer-events-none" />

            <div className="relative mb-5 md:mb-6">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h2 className="text-lg md:text-xl font-bold text-white">Premium Plan</h2>
                <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                  <Crown className="w-3 h-3" />
                  BEST VALUE
                </span>
              </div>
              <p className="text-emerald-200 text-sm">Full access to every feature</p>
              <div className="mt-3 md:mt-4">
                <span className="text-3xl md:text-4xl font-black text-white">₦5,000</span>
                <span className="text-emerald-300 text-sm ml-1">/month</span>
              </div>
            </div>

            <ul className="space-y-2.5 md:space-y-3 mb-6 md:mb-8 relative">
              {PREMIUM_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 mt-0.5 shrink-0" />
                  <span className="text-sm text-emerald-50 leading-snug">{f.label}</span>
                </li>
              ))}
            </ul>

            {isPremium ? (
              <div className="relative w-full py-2.5 md:py-3 rounded-xl md:rounded-2xl bg-white/20 border border-white/30 text-center text-sm font-bold text-white">
                ✅ Premium Active
                {user?.premiumExpiry
                  ? ` — expires ${new Date(user.premiumExpiry).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`
                  : ""}
              </div>
            ) : (
              <div className="relative w-full py-2.5 md:py-3 rounded-xl md:rounded-2xl bg-white text-[#008A4B] text-center text-sm font-bold shadow-lg cursor-default flex items-center justify-center gap-1.5 px-3">
                <Crown className="w-4 h-4 shrink-0" />
                <span className="sm:hidden">Go Premium — ₦5,000/mo</span>
                <span className="hidden sm:inline">Pay ₦5,000/month — Go Premium 👑</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Payment Instructions — only show for non-premium */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 mb-8 md:mb-10"
          >
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#008A4B] shrink-0" />
              How to Upgrade
            </h3>
            <p className="text-muted-foreground text-sm mb-5 md:mb-6">
              We confirm payments manually to keep things secure. Just follow these 3 steps:
            </p>
            <ol className="space-y-4 mb-5 md:mb-6">
              {[
                {
                  step: "1",
                  title: "Transfer ₦5,000 to our account",
                  desc: `Bank: ${BANK_DETAILS.bank} · Account Name: ${BANK_DETAILS.accountName} · Account Number: ${BANK_DETAILS.accountNumber}`,
                },
                {
                  step: "2",
                  title: "Send your proof of payment",
                  desc: "WhatsApp or email us your transfer receipt along with your registered email address: support@neat-affordable.ng",
                },
                {
                  step: "3",
                  title: "Wait for admin confirmation",
                  desc: "Our team upgrades your account within 24 hours. Then click 'Check Premium Status' at the top of this page to see your new status instantly.",
                },
              ].map((item) => (
                <li key={item.step} className="flex gap-3 md:gap-4">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#008A4B] text-white flex items-center justify-center text-xs md:text-sm font-bold shrink-0 mt-0.5">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    <p className="text-muted-foreground text-xs md:text-sm mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Bank Details Card */}
            <div className="bg-slate-50 rounded-xl md:rounded-2xl p-4 md:p-5 border border-slate-200">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Bank Details</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground shrink-0">Bank</span>
                  <span className="font-semibold text-gray-900 text-right">{BANK_DETAILS.bank}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground shrink-0">Account Name</span>
                  <span className="font-semibold text-gray-900 text-right">{BANK_DETAILS.accountName}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground shrink-0">Account No.</span>
                  <span className="font-bold text-[#008A4B] text-base md:text-lg">{BANK_DETAILS.accountNumber}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
        >
          {[
            { icon: Bell, title: "New Listing Alerts", desc: "Get notified the instant a matching property is listed", color: "bg-blue-50 text-blue-600" },
            { icon: Wifi, title: "Offline Mode", desc: "Access saved listings without internet in remote areas", color: "bg-purple-50 text-purple-600" },
            { icon: MapPin, title: "Transport Guides", desc: "Know exact routes and fares from apartment to PPA", color: "bg-amber-50 text-amber-600" },
            { icon: Wrench, title: "Artisan Directory", desc: "Find trusted local plumbers, electricians & more", color: "bg-emerald-50 text-emerald-600" },
          ].map((item, i) => (
            <div key={i} className={`bg-white rounded-xl md:rounded-2xl border border-slate-200 p-4 md:p-5 text-center shadow-sm ${isPremium ? "ring-2 ring-[#008A4B]/20" : ""}`}>
              <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl ${item.color} flex items-center justify-center mx-auto mb-2 md:mb-3`}>
                <item.icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <p className="font-bold text-gray-900 text-xs md:text-sm mb-1">{item.title}</p>
              <p className="text-muted-foreground text-[11px] md:text-xs leading-relaxed hidden sm:block">{item.desc}</p>
              {isPremium && <p className="text-[10px] text-emerald-600 font-bold mt-1">✅ Unlocked</p>}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
