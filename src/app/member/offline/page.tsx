"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Crown, Lock, Wifi, WifiOff, BookmarkCheck, Home, MapPin,
  Trash2, ArrowLeft, Download, ToggleLeft, ToggleRight
} from "lucide-react";

function PremiumGate() {
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
        <h2 className="text-2xl font-black text-gray-900 mb-3">Offline / Low Data Mode</h2>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          Save listings to your device and access them even when you have no internet — perfect for remote PPA locations with poor network coverage.
        </p>
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

const STORAGE_KEY = "na_offline_listings";

interface CachedListing {
  id: string;
  title: string;
  location: string;
  state: string;
  price: number;
  bedrooms: number;
  savedAt: string;
}

export default function OfflineModePage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isPremium = user?.isPremium;

  const [lowDataMode, setLowDataMode] = useState(false);
  const [cachedListings, setCachedListings] = useState<CachedListing[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load cached listings from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setCachedListings(JSON.parse(stored));
    } catch {}

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const removeListing = (id: string) => {
    const updated = cachedListings.filter((l) => l.id !== id);
    setCachedListings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearAll = () => {
    setCachedListings([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (!isPremium) return <PremiumGate />;

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/member" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-foreground">Offline Mode</h1>
            <p className="text-muted-foreground text-xs mt-0.5">Access your saved listings without internet</p>
          </div>
        </div>

        {/* Connection status */}
        <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 mb-6 ${isOnline ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
          {isOnline
            ? <Wifi className="w-4 h-4 text-emerald-600 shrink-0" />
            : <WifiOff className="w-4 h-4 text-red-500 shrink-0" />
          }
          <p className={`text-xs font-semibold ${isOnline ? "text-emerald-800" : "text-red-700"}`}>
            {isOnline ? "You are online — all features available" : "You are offline — showing cached listings only"}
          </p>
        </div>

        {/* Premium Banner */}
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 mb-6">
          <Crown className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-emerald-800 text-xs font-semibold">
            Premium feature unlocked — save listings for offline access anywhere, even in areas with no network.
          </p>
        </div>

        {/* Low Data Mode Toggle */}
        <div className="bg-card rounded-2xl border border-border p-4 md:p-5 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Low Data Mode</p>
                <p className="text-xs text-muted-foreground mt-0.5">Loads text-only listings — saves up to 90% data</p>
              </div>
            </div>
            <button
              onClick={() => setLowDataMode(!lowDataMode)}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${lowDataMode ? "bg-purple-600" : "bg-slate-300"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${lowDataMode ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
          {lowDataMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 pt-3 border-t border-border"
            >
              <p className="text-xs text-muted-foreground leading-relaxed">
                ✅ Low Data Mode is ON — images are hidden, only listing details are loaded. Great for NYSC camp areas with poor reception.
              </p>
            </motion.div>
          )}
        </div>

        {/* How to save listings */}
        <div className="bg-card rounded-2xl border border-border p-4 md:p-5 mb-6">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-[#008A4B]" />
            How to Save Listings for Offline
          </h3>
          <ol className="space-y-2">
            {[
              "Browse to any property listing",
              "Tap the bookmark 🔖 icon on the listing card",
              "The listing is saved to your device storage",
              "Access it here anytime — even without internet",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#008A4B] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-xs text-muted-foreground leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Cached Listings */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">
              Saved Listings ({cachedListings.length})
            </h3>
            {cachedListings.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear all
              </button>
            )}
          </div>

          {cachedListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <BookmarkCheck className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground text-sm mb-1">No saved listings yet</p>
              <p className="text-muted-foreground text-xs max-w-xs">
                Bookmark any listing from the explore page and it will appear here for offline access.
              </p>
              <Link
                href="/member"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#008A4B] text-white text-xs font-semibold hover:bg-[#006B3A] transition-colors"
              >
                <Home className="w-3.5 h-3.5" /> Browse Listings
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {cachedListings.map((listing) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 px-4 md:px-5 py-3 md:py-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <Home className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{listing.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {listing.state}
                      </span>
                      <span className="text-xs text-[#008A4B] font-semibold">
                        ₦{listing.price.toLocaleString()}/yr
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeListing(listing.id)}
                    className="text-muted-foreground hover:text-red-500 transition-colors p-1 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
