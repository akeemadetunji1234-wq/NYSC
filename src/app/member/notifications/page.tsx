"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { getNotifications, markAsRead, markAllAsRead } from "../../actions/notifications";
import { createSavedSearch, deleteSavedSearch, getSavedSearches } from "../../actions/premium";
import { RealtimeNotificationListener } from "../../../components/notifications/RealtimeNotificationListener";
import { Crown, Bell, BellOff, Clock, CheckCheck, Lock, ArrowLeft, Plus, Trash2, Radio } from "lucide-react";

function PremiumGate({ feature, description }: { feature: string; description: string }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm w-full">
        <div className="w-20 h-20 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center mx-auto mb-5"><Lock className="w-8 h-8 text-amber-500" /></div>
        <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full mb-4"><Crown className="w-3.5 h-3.5" /> Premium Feature</div>
        <h2 className="text-2xl font-black text-gray-900 mb-3">{feature}</h2>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">{description}</p>
        <Link href="/member/premium" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 font-bold text-sm shadow-lg"> <Crown className="w-4 h-4" /> Upgrade to Premium — ₦5,000/mo</Link>
      </motion.div>
    </div>
  );
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isPremium = Boolean(user?.isPremium && user?.premiumPlan === "CORP_PREMIUM" && (!user?.premiumExpiry || new Date(user.premiumExpiry) > new Date()));
  const [notifications, setNotifications] = useState<any[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [browserAlerts, setBrowserAlerts] = useState(typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted");
  const [form, setForm] = useState({ name: "My housing search", state: "", lga: "", minPrice: "", maxPrice: "", bedrooms: "" });
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const [notificationResult, searches] = await Promise.all([getNotifications(), getSavedSearches()]);
    if (notificationResult.success && notificationResult.data) setNotifications(notificationResult.data);
    setSavedSearches(searches);
  }, []);

  useEffect(() => {
    if (!isPremium || !user?.id) return;
    refresh().catch(() => undefined);
    const fallback = window.setInterval(() => refresh().catch(() => undefined), 60_000);
    return () => window.clearInterval(fallback);
  }, [isPremium, refresh, user?.id]);

  const handleRealtimeNotification = useCallback(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const enableBrowserAlerts = async () => {
    if (typeof Notification === "undefined") return;
    const permission = await Notification.requestPermission();
    setBrowserAlerts(permission === "granted");
  };

  const handleSaveSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createSavedSearch({ name: form.name, state: form.state || null, lga: form.lga || null, minPrice: form.minPrice ? Number(form.minPrice) : null, maxPrice: form.maxPrice ? Number(form.maxPrice) : null, bedrooms: form.bedrooms ? Number(form.bedrooms) : null });
      setForm({ name: "My housing search", state: "", lga: "", minPrice: "", maxPrice: "", bedrooms: "" });
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAllRead = async () => { setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))); await markAllAsRead(); };
  const handleMarkRead = async (id: string, link?: string | null) => { setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n)); await markAsRead(id); if (link) window.location.href = link; };

  if (!isPremium) return <PremiumGate feature="New Listing Notifications" description="Create saved searches and get notified when a published property matches your budget and preferred location." />;

  return (
    <div className="min-h-screen bg-secondary">
      <RealtimeNotificationListener userId={user?.id} enabled={isPremium} browserAlerts={browserAlerts} onNotification={handleRealtimeNotification} />
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3"><Link href="/member" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link><div><div className="flex items-center gap-2"><h1 className="text-xl md:text-2xl font-black text-foreground">Smart alerts</h1>{unreadCount > 0 && <span className="w-5 h-5 rounded-full bg-[#008A4B] text-white text-[10px] font-bold flex items-center justify-center">{unreadCount}</span>}</div><p className="text-muted-foreground text-xs mt-0.5">Saved-search notifications for Corp Member Premium</p></div></div>
          {unreadCount > 0 && <button onClick={handleMarkAllRead} className="text-xs text-[#008A4B] font-semibold hover:underline flex items-center gap-1"><CheckCheck className="w-3.5 h-3.5" /> Mark all read</button>}
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 mb-6 flex items-center justify-between gap-3"><p className="text-emerald-800 text-xs font-semibold flex items-center gap-2"><Radio className="w-4 h-4" /> Pusher real-time alerts are active when configured.</p><button onClick={enableBrowserAlerts} className="text-xs font-bold text-emerald-800 underline">{browserAlerts ? "Browser alerts enabled" : "Enable browser alerts"}</button></div>

        <form onSubmit={handleSaveSearch} className="bg-card rounded-2xl border border-border p-4 mb-6 space-y-3"><div className="flex items-center gap-2"><Bell className="w-5 h-5 text-[#008A4B]" /><h2 className="font-bold text-foreground">Create a saved search</h2></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Search name" className="rounded-xl border border-border bg-background px-3 py-2 text-sm" /><input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" className="rounded-xl border border-border bg-background px-3 py-2 text-sm" /><input value={form.lga} onChange={(e) => setForm({ ...form, lga: e.target.value })} placeholder="LGA" className="rounded-xl border border-border bg-background px-3 py-2 text-sm" /><input type="number" min="0" value={form.minPrice} onChange={(e) => setForm({ ...form, minPrice: e.target.value })} placeholder="Minimum annual rent" className="rounded-xl border border-border bg-background px-3 py-2 text-sm" /><input type="number" min="0" value={form.maxPrice} onChange={(e) => setForm({ ...form, maxPrice: e.target.value })} placeholder="Maximum annual rent" className="rounded-xl border border-border bg-background px-3 py-2 text-sm" /><input type="number" min="1" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} placeholder="Minimum bedrooms" className="rounded-xl border border-border bg-background px-3 py-2 text-sm" /></div><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#008A4B] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Plus className="w-4 h-4" /> {saving ? "Saving..." : "Save search"}</button></form>

        {savedSearches.length > 0 && <div className="bg-card rounded-2xl border border-border p-4 mb-6"><h2 className="font-bold text-foreground mb-3">Your saved searches</h2><div className="space-y-2">{savedSearches.map((search) => <div key={search.id} className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2"><div><p className="text-sm font-semibold">{search.name}</p><p className="text-xs text-muted-foreground">{[search.state, search.lga, search.minPrice && `from ₦${search.minPrice.toLocaleString()}`, search.maxPrice && `up to ₦${search.maxPrice.toLocaleString()}`, search.bedrooms && `${search.bedrooms}+ bedrooms`].filter(Boolean).join(" · ") || "Any published property"}</p></div><button onClick={() => deleteSavedSearch(search.id).then(refresh)} className="text-muted-foreground hover:text-red-600" aria-label={`Delete ${search.name}`}><Trash2 className="w-4 h-4" /></button></div>)}</div></div>}

        <div className="space-y-3"><AnimatePresence>{notifications.map((n, i) => <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} onClick={() => handleMarkRead(n.id, n.link)} className={`bg-card rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md ${n.read ? "border-border opacity-70" : "border-[#008A4B]/30 shadow-sm"}`}><div className="flex items-start gap-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.read ? "bg-secondary" : "bg-[#008A4B]/10"}`}><Bell className={`w-5 h-5 ${n.read ? "text-muted-foreground" : "text-[#008A4B]"}`} /></div><div className="flex-1 min-w-0"><div className="flex items-start justify-between gap-2"><p className={`text-sm font-semibold leading-snug ${n.read ? "text-muted-foreground" : "text-foreground"}`}>{n.title}</p>{!n.read && <span className="w-2 h-2 rounded-full bg-[#008A4B] shrink-0 mt-1" />}</div><p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p><span className="inline-flex items-center gap-1 text-muted-foreground text-[10px] mt-1.5"><Clock className="w-2.5 h-2.5" /> {new Date(n.createdAt).toLocaleDateString()}</span></div></div></motion.div>)}</AnimatePresence>{notifications.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm"><BellOff className="w-8 h-8 mx-auto mb-2 opacity-50" />No matching listing alerts yet.</div>}</div>
      </div>
    </div>
  );
}
