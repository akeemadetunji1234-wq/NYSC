"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Bus, Crown, Lock, MapPin, RefreshCw, Route, Search } from "lucide-react";
import { getTransportGuides } from "../../actions/premium";
import { formatNairaRange } from "../../../lib/transport";

function PremiumGate() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-3">Transport fare ranges</h2>
        <p className="text-muted-foreground text-sm mb-7">
          Premium members get current, admin-maintained estimated fare ranges for movement between NYSC locations.
        </p>
        <Link href="/member/premium" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-amber-950 font-bold text-sm">
          <Crown className="w-4 h-4" /> Upgrade to Premium — ₦5,000/mo
        </Link>
      </div>
    </div>
  );
}

export default function TransportPage() {
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const activePremium = Boolean(
    user?.isPremium &&
      user?.premiumPlan === "CORP_PREMIUM" &&
      (!user?.premiumExpiry || new Date(user.premiumExpiry).getTime() > Date.now()),
  );
  const [guides, setGuides] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadGuides = () => {
    setLoading(true);
    setError("");
    getTransportGuides()
      .then(setGuides)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load transport fare ranges"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (activePremium) loadGuides();
  }, [activePremium]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return guides;
    return guides
      .map((guide) => ({
        ...guide,
        routes: (guide.routes || []).filter((route: any) =>
          [guide.state, guide.title, route.from, route.to, route.mode, route.note]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(term)),
        ),
      }))
      .filter((guide) => guide.routes.length > 0 || String(guide.state || "").toLowerCase().includes(term));
  }, [guides, search]);

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!activePremium) return <PremiumGate />;

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-5xl mx-auto px-4 py-7 md:py-10">
        <div className="flex items-center gap-3 mb-7">
          <Link href="/member" className="text-muted-foreground hover:text-foreground" aria-label="Back to member dashboard">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black">Transport Fare Guide</h1>
            <p className="text-xs text-muted-foreground mt-1">Estimated movement prices maintained by the Neat & Affordable team</p>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 mb-6 text-sm text-emerald-950">
          These are reference ranges for transport between destinations. They are estimates that may change by route, timing, vehicle type, and operator. Neat & Affordable does not collect transport or property payments through this guide.
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search state, origin, destination, or transport mode"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm"
            />
          </div>
          <button onClick={loadGuides} className="px-4 rounded-xl border border-border bg-card" aria-label="Refresh transport fare ranges">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading current fare ranges...</div>
        ) : error ? (
          <div className="py-16 text-center text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Bus className="w-8 h-8 mx-auto mb-3" />
            No published fare ranges match your search.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {filtered.map((guide) => (
              <article key={guide.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-bold text-lg">{guide.state} Transport Fares</h2>
                    <p className="text-xs text-muted-foreground mt-1">Updated {new Date(guide.updatedAt).toLocaleDateString("en-NG")}</p>
                  </div>
                  <Route className="w-5 h-5 text-[#008A4B]" />
                </div>
                {guide.description && <p className="text-sm text-muted-foreground mb-4">{guide.description}</p>}
                <div className="space-y-3">
                  {(guide.routes || []).map((route: any, index: number) => (
                    <div key={`${guide.id}-${index}`} className="rounded-xl bg-secondary p-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <MapPin className="w-4 h-4 text-[#008A4B]" />
                        {route.from} → {route.to}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-white/80 px-2 py-1 font-semibold text-foreground">{route.mode}</span>
                        <span className="font-bold text-[#008A4B]">Estimated fare: {formatNairaRange(route.minFare, route.maxFare, guide.currency)}</span>
                        {route.unit && <span className="text-muted-foreground">{route.unit}</span>}
                      </div>
                      {route.note && <p className="text-xs text-muted-foreground mt-2">{route.note}</p>}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
