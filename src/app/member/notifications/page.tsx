"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Crown, Bell, BellOff, Home, MapPin, Clock, CheckCheck, Lock, Wifi, WifiOff, BookmarkCheck, ArrowLeft } from "lucide-react";

// ─── Premium Gate ──────────────────────────────────────────────────────────────
function PremiumGate({ feature, icon: Icon, description }: { feature: string; icon: any; description: string }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm w-full"
      >
        <div className="w-20 h-20 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-8 h-8 text-amber-500" />
        </div>
        <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full mb-4">
          <Crown className="w-3.5 h-3.5" /> Premium Feature
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-3">{feature}</h2>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">{description}</p>
        <Link
          href="/member/premium"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 font-bold text-sm shadow-lg hover:from-amber-500 hover:to-amber-600 transition-all"
        >
          <Crown className="w-4 h-4" /> Upgrade to Premium — ₦5,000/mo
        </Link>
      </motion.div>
    </div>
  );
}

// ─── Mock notifications data ────────────────────────────────────────────────────
const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    type: "new_listing",
    title: "New listing in Ibadan, Oyo",
    desc: "2-bedroom flat near NYSC Secretariat — ₦180,000/yr",
    time: "2 mins ago",
    read: false,
    state: "Oyo",
  },
  {
    id: "2",
    type: "new_listing",
    title: "New listing in Gwagwalada, Abuja",
    desc: "Self-contained apartment with 24h electricity — ₦250,000/yr",
    time: "14 mins ago",
    read: false,
    state: "Abuja",
  },
  {
    id: "3",
    type: "new_listing",
    title: "New listing in Port Harcourt, Rivers",
    desc: "3-bedroom flat, corpers lodge — ₦220,000/yr",
    time: "1 hour ago",
    read: true,
    state: "Rivers",
  },
  {
    id: "4",
    type: "new_listing",
    title: "New listing in Enugu, Enugu",
    desc: "1-bedroom flat near Coal Camp — ₦150,000/yr",
    time: "3 hours ago",
    read: true,
    state: "Enugu",
  },
  {
    id: "5",
    type: "new_listing",
    title: "New listing in Kano, Kano",
    desc: "Mini flat with solar power — ₦130,000/yr",
    time: "5 hours ago",
    read: true,
    state: "Kano",
  },
  {
    id: "6",
    type: "new_listing",
    title: "New listing in Benin City, Edo",
    desc: "2-bedroom, furnished, corper-ready — ₦200,000/yr",
    time: "Yesterday",
    read: true,
    state: "Edo",
  },
];

export default function NotificationsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isPremium = user?.isPremium;

  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  if (!isPremium) {
    return (
      <PremiumGate
        feature="New Listing Notifications"
        icon={Bell}
        description="Get instantly notified the moment a new property matching your state is listed — before other corpers even see it."
      />
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/member" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-foreground">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#008A4B] text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-xs mt-0.5">New listing alerts for premium members</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[#008A4B] font-semibold hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Premium Unlocked Banner */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 mb-6"
        >
          <Crown className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-emerald-800 text-xs font-semibold">
            Premium feature unlocked — you get notified first when new properties are listed in your state.
          </p>
        </motion.div>

        {/* Alerts toggle */}
        <div className="bg-card rounded-2xl border border-border p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {alertsEnabled
              ? <Bell className="w-5 h-5 text-[#008A4B]" />
              : <BellOff className="w-5 h-5 text-muted-foreground" />
            }
            <div>
              <p className="text-sm font-semibold text-foreground">New Listing Alerts</p>
              <p className="text-xs text-muted-foreground">Get notified when properties are listed in your state</p>
            </div>
          </div>
          <button
            onClick={() => setAlertsEnabled(!alertsEnabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${alertsEnabled ? "bg-[#008A4B]" : "bg-slate-300"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${alertsEnabled ? "left-5" : "left-0.5"}`} />
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          <AnimatePresence>
            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => markRead(n.id)}
                className={`bg-card rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                  n.read ? "border-border opacity-70" : "border-[#008A4B]/30 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.read ? "bg-secondary" : "bg-[#008A4B]/10"}`}>
                    <Home className={`w-5 h-5 ${n.read ? "text-muted-foreground" : "text-[#008A4B]"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold leading-snug ${n.read ? "text-muted-foreground" : "text-foreground"}`}>
                        {n.title}
                      </p>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-[#008A4B] shrink-0 mt-1" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.desc}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center gap-1 bg-secondary text-muted-foreground text-[10px] font-medium px-2 py-0.5 rounded-full">
                        <MapPin className="w-2.5 h-2.5" /> {n.state}
                      </span>
                      <span className="inline-flex items-center gap-1 text-muted-foreground text-[10px]">
                        <Clock className="w-2.5 h-2.5" /> {n.time}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
