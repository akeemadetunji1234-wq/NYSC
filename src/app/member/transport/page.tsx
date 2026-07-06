"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Crown,
  Lock,
  Search,
  MapPin,
  Clock,
  Banknote,
  Bus,
  Bike,
  Car,
  CheckCircle2,
  ChevronDown,
  Navigation,
  Zap,
} from "lucide-react";

// ---------- Types ----------
interface Route {
  from: string;
  to: string;
  transport: string;
  fare: number;
}

interface StateCard {
  state: string;
  secretariat: string;
  fareRange: string;
  travelTime: string;
  transportTypes: { name: string; color: string }[];
  routes: Route[];
  tip?: string;
}

// ---------- Data ----------
const TRANSPORT_DATA: StateCard[] = [
  {
    state: "Lagos",
    secretariat: "NYSC Secretariat, Alausa, Ikeja",
    fareRange: "₦300 – ₦1,500",
    travelTime: "25 – 90 mins",
    transportTypes: [
      { name: "BRT Bus", color: "#1a73e8" },
      { name: "Danfo", color: "#f59e0b" },
      { name: "Keke Napep", color: "#10b981" },
      { name: "Okada", color: "#ef4444" },
    ],
    routes: [
      { from: "Ojodu-Berger", to: "Secretariat", transport: "BRT Bus", fare: 400 },
      { from: "Yaba", to: "Secretariat", transport: "Danfo", fare: 500 },
      { from: "Ogba", to: "Secretariat", transport: "Keke + Bus", fare: 600 },
    ],
    tip: "Avoid peak hours (7–9am, 4–7pm) — traffic can triple your travel time.",
  },
  {
    state: "Abuja (FCT)",
    secretariat: "NYSC Secretariat, Area 11, Garki",
    fareRange: "₦200 – ₦900",
    travelTime: "15 – 60 mins",
    transportTypes: [
      { name: "BRT Bus", color: "#1a73e8" },
      { name: "Keke Napep", color: "#10b981" },
      { name: "Taxi/Ride", color: "#8b5cf6" },
    ],
    routes: [
      { from: "Kubwa", to: "Secretariat", transport: "BRT Bus", fare: 350 },
      { from: "Lugbe", to: "Secretariat", transport: "Keke + Bus", fare: 450 },
      { from: "Nyanya", to: "Secretariat", transport: "Bus", fare: 300 },
    ],
    tip: "FCDA buses are cheaper but less frequent. Bolt/Uber often fastest.",
  },
  {
    state: "Kano",
    secretariat: "NYSC Secretariat, No. 1 Audu Bako Way, Kano",
    fareRange: "₦150 – ₦600",
    travelTime: "10 – 45 mins",
    transportTypes: [
      { name: "Keke Napep", color: "#10b981" },
      { name: "Danfo", color: "#f59e0b" },
      { name: "Okada", color: "#ef4444" },
    ],
    routes: [
      { from: "Sabon Gari", to: "Secretariat", transport: "Keke", fare: 200 },
      { from: "Bompai", to: "Secretariat", transport: "Danfo", fare: 150 },
      { from: "Gwale", to: "Secretariat", transport: "Okada", fare: 300 },
    ],
    tip: "Keke Napep is the most reliable and affordable within city centre.",
  },
  {
    state: "Oyo",
    secretariat: "NYSC Secretariat, Agodi, Ibadan",
    fareRange: "₦150 – ₦700",
    travelTime: "10 – 50 mins",
    transportTypes: [
      { name: "Keke Napep", color: "#10b981" },
      { name: "Danfo", color: "#f59e0b" },
      { name: "Okada", color: "#ef4444" },
    ],
    routes: [
      { from: "Bodija", to: "Secretariat", transport: "Keke + Bus", fare: 500 },
      { from: "UI Gate", to: "Secretariat", transport: "Danfo", fare: 300 },
      { from: "Ojoo", to: "Secretariat", transport: "Keke", fare: 400 },
    ],
    tip: "Challenge road is usually congested; opt for Bodija–Agodi route.",
  },
  {
    state: "Rivers",
    secretariat: "NYSC Secretariat, Moscow Road, Port Harcourt",
    fareRange: "₦200 – ₦800",
    travelTime: "15 – 55 mins",
    transportTypes: [
      { name: "Keke Napep", color: "#10b981" },
      { name: "BRT Bus", color: "#1a73e8" },
      { name: "Okada", color: "#ef4444" },
    ],
    routes: [
      { from: "Rumuola", to: "Secretariat", transport: "Keke", fare: 300 },
      { from: "Mile 1", to: "Secretariat", transport: "Bus", fare: 250 },
      { from: "Trans Amadi", to: "Secretariat", transport: "Keke + Okada", fare: 500 },
    ],
    tip: "Avoid waterside routes during rainy season — roads may flood.",
  },
  {
    state: "Enugu",
    secretariat: "NYSC Secretariat, Independence Layout, Enugu",
    fareRange: "₦100 – ₦500",
    travelTime: "10 – 40 mins",
    transportTypes: [
      { name: "Keke Napep", color: "#10b981" },
      { name: "Danfo", color: "#f59e0b" },
      { name: "Okada", color: "#ef4444" },
    ],
    routes: [
      { from: "Ogui Road", to: "Secretariat", transport: "Keke", fare: 150 },
      { from: "New Haven", to: "Secretariat", transport: "Danfo", fare: 200 },
      { from: "GRA", to: "Secretariat", transport: "Keke", fare: 300 },
    ],
    tip: "Enugu is compact — most commutes are under 30 minutes.",
  },
  {
    state: "Anambra",
    secretariat: "NYSC Secretariat, Awka, Anambra",
    fareRange: "₦150 – ₦600",
    travelTime: "10 – 45 mins",
    transportTypes: [
      { name: "Keke Napep", color: "#10b981" },
      { name: "Okada", color: "#ef4444" },
      { name: "Danfo", color: "#f59e0b" },
    ],
    routes: [
      { from: "Unizik Temp Site", to: "Secretariat", transport: "Keke", fare: 200 },
      { from: "Fidelity Bank Junction", to: "Secretariat", transport: "Okada", fare: 300 },
      { from: "Ifite", to: "Secretariat", transport: "Danfo", fare: 150 },
    ],
    tip: "Awka roads are well-maintained; Keke is preferred for short hops.",
  },
  {
    state: "Delta",
    secretariat: "NYSC Secretariat, Asaba, Delta State",
    fareRange: "₦150 – ₦700",
    travelTime: "10 – 50 mins",
    transportTypes: [
      { name: "Keke Napep", color: "#10b981" },
      { name: "Danfo", color: "#f59e0b" },
      { name: "Okada", color: "#ef4444" },
    ],
    routes: [
      { from: "Cable Point", to: "Secretariat", transport: "Keke", fare: 200 },
      { from: "Okpanam Road", to: "Secretariat", transport: "Danfo", fare: 250 },
      { from: "Infant Jesus", to: "Secretariat", transport: "Okada", fare: 350 },
    ],
    tip: "Asaba is small and navigable — most areas within 30 mins of secretariat.",
  },
];

const transportIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("bus") || n.includes("brt") || n.includes("danfo"))
    return <Bus className="w-3 h-3" />;
  if (n.includes("keke")) return <Car className="w-3 h-3" />;
  return <Bike className="w-3 h-3" />;
};

// ---------- Premium Lock Screen ----------
function PremiumLockScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/95 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-6 px-8 py-12 text-center max-w-sm mx-auto"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="relative"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/30">
            <Crown className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gray-900 border-2 border-gray-700 flex items-center justify-center">
            <Lock className="w-4 h-4 text-gray-400" />
          </div>
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">This is a Premium Feature</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Transport Route Guides are exclusively available to Neat &amp; Affordable Premium members. Upgrade now to
            get state-by-state routes, fare estimates, and transport tips.
          </p>
        </div>

        <Link
          href="/member/premium"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
          style={{ background: "linear-gradient(135deg, #008A4B, #00b35e)" }}
        >
          <Crown className="w-4 h-4" />
          Upgrade to Premium
        </Link>
      </motion.div>
    </div>
  );
}

// ---------- Main Page ----------
export default function TransportPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isPremium = user?.isPremium === true;

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return TRANSPORT_DATA;
    return TRANSPORT_DATA.filter((s) => s.state.toLowerCase().includes(q));
  }, [search]);

  if (!isPremium) return <PremiumLockScreen />;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20">
      {/* Hero Banner */}
      <div
        className="relative overflow-hidden px-4 pt-12 pb-8"
        style={{ background: "linear-gradient(135deg, #003d22 0%, #008A4B 60%, #00b35e 100%)" }}
      >
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white"
              style={{
                width: `${80 + i * 60}px`,
                height: `${80 + i * 60}px`,
                top: `${-20 + i * 10}%`,
                left: `${-10 + i * 15}%`,
              }}
            />
          ))}
        </div>
        <div className="relative max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold mb-4"
          >
            <CheckCircle2 className="w-4 h-4 text-green-200" />
            Premium Unlocked
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2"
          >
            Transport Route Guides
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-green-100 text-sm sm:text-base max-w-xl"
          >
            State-by-state transport routes, fare estimates, and commute tips from residential areas to your NYSC
            Secretariat or PPA.
          </motion.p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-4xl mx-auto px-4 -mt-5 relative z-10">
        <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 shadow-xl">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by state (e.g. Lagos, Kano…)"
            className="flex-1 bg-transparent outline-none text-white placeholder-gray-500 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-gray-500 hover:text-gray-300 transition-colors text-xs"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-4xl mx-auto px-4 mt-5 grid grid-cols-3 gap-3 text-center">
        {[
          { label: "States Covered", value: "8+" },
          { label: "Transport Types", value: "5+" },
          { label: "Route Examples", value: "24+" },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-800/60 border border-gray-700 rounded-xl py-3 px-2">
            <p className="text-lg font-bold" style={{ color: "#008A4B" }}>
              {stat.value}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="max-w-4xl mx-auto px-4 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-16 text-gray-500"
            >
              <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No states found for &ldquo;{search}&rdquo;</p>
            </motion.div>
          ) : (
            filtered.map((card, i) => {
              const isOpen = expanded === card.state;
              return (
                <motion.div
                  key={card.state}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden hover:border-[#008A4B]/60 transition-all duration-200"
                >
                  {/* Card Header */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : card.state)}
                    className="w-full text-left p-5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: "#008A4B" }} />
                          <h2 className="font-bold text-white text-lg leading-tight truncate">{card.state}</h2>
                        </div>
                        <p className="text-gray-400 text-xs truncate">{card.secretariat}</p>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 flex-shrink-0 mt-1 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 bg-gray-700/50 rounded-xl px-3 py-2">
                        <Banknote className="w-4 h-4 text-amber-400" />
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Fare Range</p>
                          <p className="text-xs font-semibold text-white">{card.fareRange}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-700/50 rounded-xl px-3 py-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Travel Time</p>
                          <p className="text-xs font-semibold text-white">{card.travelTime}</p>
                        </div>
                      </div>
                    </div>

                    {/* Transport Type Badges */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {card.transportTypes.map((t) => (
                        <span
                          key={t.name}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium"
                          style={{
                            backgroundColor: `${t.color}22`,
                            color: t.color,
                            border: `1px solid ${t.color}44`,
                          }}
                        >
                          {transportIcon(t.name)}
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </button>

                  {/* Expandable Routes */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        key="routes"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-gray-700 px-5 py-4 space-y-3">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                            Route Examples
                          </p>
                          {card.routes.map((r, ri) => (
                            <div
                              key={ri}
                              className="flex items-center gap-3 bg-gray-700/40 rounded-xl px-3 py-2.5"
                            >
                              <Navigation className="w-4 h-4 flex-shrink-0" style={{ color: "#008A4B" }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white font-medium truncate">
                                  {r.from} → {r.to}
                                </p>
                                <p className="text-xs text-gray-400">via {r.transport}</p>
                              </div>
                              <span className="text-xs font-bold text-amber-400 flex-shrink-0">≈₦{r.fare}</span>
                            </div>
                          ))}

                          {card.tip && (
                            <div className="flex items-start gap-2 mt-2 p-3 rounded-xl bg-[#008A4B]/10 border border-[#008A4B]/20">
                              <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#008A4B" }} />
                              <p className="text-xs text-green-300 leading-relaxed">{card.tip}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-gray-600 text-xs mt-10 px-4">
        Fares are approximate and may vary by time of day, traffic, and negotiation.
      </p>
    </div>
  );
}
