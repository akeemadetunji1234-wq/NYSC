"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Crown, Lock, Search, Star, Phone, MapPin, CheckCircle2,
  ArrowLeft, Wrench, Zap, Hammer, Paintbrush, Wind, Sparkles, MessageCircle
} from "lucide-react";

// ─── Premium Gate ──────────────────────────────────────────────────────────────
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
        <h2 className="text-2xl font-black text-gray-900 mb-3">Artisan Directory</h2>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          Access our directory of corper-verified local artisans — plumbers, electricians, carpenters and more — trusted by other NYSC members in your state.
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

// ─── Data ──────────────────────────────────────────────────────────────────────
type Category = "All" | "Plumber" | "Electrician" | "Carpenter" | "Painter" | "AC Technician" | "Cleaner";

const CATEGORIES: { label: Category; icon: any; color: string }[] = [
  { label: "All", icon: Sparkles, color: "bg-slate-100 text-slate-700" },
  { label: "Plumber", icon: Wrench, color: "bg-blue-100 text-blue-700" },
  { label: "Electrician", icon: Zap, color: "bg-yellow-100 text-yellow-700" },
  { label: "Carpenter", icon: Hammer, color: "bg-amber-100 text-amber-700" },
  { label: "Painter", icon: Paintbrush, color: "bg-pink-100 text-pink-700" },
  { label: "AC Technician", icon: Wind, color: "bg-cyan-100 text-cyan-700" },
  { label: "Cleaner", icon: Sparkles, color: "bg-emerald-100 text-emerald-700" },
];

import { getArtisans } from "../../actions/admin";

const CATEGORY_COLORS: Record<string, string> = {
  Plumber: "bg-blue-100 text-blue-700",
  Electrician: "bg-yellow-100 text-yellow-700",
  Carpenter: "bg-amber-100 text-amber-700",
  Painter: "bg-pink-100 text-pink-700",
  "AC Technician": "bg-cyan-100 text-cyan-700",
  Cleaner: "bg-emerald-100 text-emerald-700",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-0.5">{rating.toFixed(1)}</span>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ArtisansPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isPremium = user?.isPremium;

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  
  const [artisans, setArtisans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPremium) {
      getArtisans().then(data => {
        setArtisans(data);
        setLoading(false);
      });
    }
  }, [isPremium]);

  if (!isPremium) return <PremiumGate />;

  const filtered = artisans.filter((a) => {
    const matchCat = activeCategory === "All" || a.trade === activeCategory;
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.state.toLowerCase().includes(search.toLowerCase()) ||
      a.lga.toLowerCase().includes(search.toLowerCase()) ||
      a.trade.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/member" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-foreground">Artisan Directory</h1>
            <p className="text-muted-foreground text-xs mt-0.5">Corper-verified local maintenance workers</p>
          </div>
        </div>

        {/* Premium banner */}
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 mb-6">
          <Crown className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-emerald-800 text-xs font-semibold">
            Premium feature unlocked — all artisans below have been used and verified by fellow corps members.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, trade, or state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B] transition-all"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORIES.map(({ label, icon: Icon, color }) => (
            <button
              key={label}
              onClick={() => setActiveCategory(label)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                activeCategory === label
                  ? "bg-[#008A4B] text-white border-[#008A4B] shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-[#008A4B]/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground mb-4">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> artisan{filtered.length !== 1 ? "s" : ""}
          {activeCategory !== "All" ? ` · ${activeCategory}` : ""}
        </p>

        {/* Artisan Cards Grid */}
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-muted-foreground text-sm">No artisans found matching your search.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((artisan, i) => (
                <motion.div
                  key={artisan.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card rounded-2xl border border-border p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-bold text-foreground text-sm shrink-0">
                        {artisan.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm leading-snug">{artisan.name}</p>
                        <StarRating rating={artisan.rating} />
                      </div>
                    </div>
                    {artisan.verified && (
                      <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>

                  {/* Trade & Location */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[artisan.trade]}`}>
                      {artisan.trade}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {artisan.lga}, {artisan.state}
                    </span>
                  </div>

                  {/* Phone & WhatsApp */}
                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <a
                      href={`tel:${artisan.phone.replace(/\s/g, "")}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-secondary text-muted-foreground text-xs font-semibold hover:bg-[#008A4B]/10 hover:text-[#008A4B] transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {artisan.phone}
                    </a>
                    <a
                      href={`https://wa.me/234${artisan.phone.replace(/^0/, "").replace(/\s/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
