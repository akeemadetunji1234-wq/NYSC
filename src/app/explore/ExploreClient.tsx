"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Home, Search } from "lucide-react";
import { getPublishedProperties } from "../actions/property";
import { ListingCard, ListingCardSkeleton, type ListingCardData } from "../../components/shared/ListingCard";

const NIGERIAN_STATES = [
  "All States", "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
  "Yobe", "Zamfara",
];

const PRICE_RANGES = [
  { label: "Any budget", value: "all" },
  { label: "Under ₦100k", value: "under100k" },
  { label: "₦100k – ₦200k", value: "100k-200k" },
  { label: "₦200k – ₦400k", value: "200k-400k" },
  { label: "Over ₦400k", value: "over400k" },
];

export function ExploreClient() {
  const [listings, setListings] = useState<ListingCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("All States");
  const [priceRange, setPriceRange] = useState("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getPublishedProperties();
        if (!cancelled) {
          setListings(Array.isArray(data) ? (data as ListingCardData[]) : []);
          setError(null);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setListings([]);
          setError("Could not load listings. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return listings.filter((listing) => {
      const haystack = `${listing.title} ${listing.location} ${listing.lga || ""}`.toLowerCase();
      if (searchQuery && !haystack.includes(searchQuery.toLowerCase())) return false;
      if (selectedState !== "All States" && listing.state?.toLowerCase() !== selectedState.toLowerCase()) return false;
      if (priceRange !== "all") {
        const price = listing.price;
        if (priceRange === "under100k" && price >= 100000) return false;
        if (priceRange === "100k-200k" && (price < 100000 || price > 200000)) return false;
        if (priceRange === "200k-400k" && (price < 200000 || price > 400000)) return false;
        if (priceRange === "over400k" && price <= 400000) return false;
      }
      return true;
    });
  }, [listings, searchQuery, selectedState, priceRange]);

  const stateCount = useMemo(() => {
    const states = new Set(filtered.map((l) => l.state).filter(Boolean));
    return states.size;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-[#f6f8f6] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#008A4B]">
              <Home className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-black">Neat & Affordable</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/signin" className="text-sm font-semibold text-slate-600 hover:text-[#008A4B]">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-[#008A4B] px-4 py-2 text-sm font-bold text-white hover:bg-[#006e3c]"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
        <section className="rounded-3xl bg-[#008A4B] p-6 text-white shadow-lg md:p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Browse without signing in</p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">Find lodges near your PPA</h1>
          <p className="mt-2 max-w-2xl text-sm text-emerald-50">
            Filter by state, budget, and area. Create an account only when you want to chat, save, or request a viewing.
          </p>
          <p className="mt-3 text-xs font-medium text-emerald-100/90">
            No rent held · Verified agents · Report in-app · Pay the agent directly
          </p>

          <div className="sticky top-[4.25rem] z-30 mt-6 grid gap-3 rounded-2xl bg-white p-3 text-slate-900 shadow-md md:grid-cols-[1fr_160px_160px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Area, lodge, or LGA"
                className="w-full rounded-xl bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none"
              />
            </div>
            <select
              value={selectedState}
              onChange={(event) => setSelectedState(event.target.value)}
              className="rounded-xl bg-slate-50 px-3 py-3 text-sm"
            >
              {NIGERIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <select
              value={priceRange}
              onChange={(event) => setPriceRange(event.target.value)}
              className="rounded-xl bg-slate-50 px-3 py-3 text-sm"
            >
              {PRICE_RANGES.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-center rounded-xl bg-[#006e3c] px-4 py-3 text-center text-sm font-bold text-white">
              {loading
                ? "Loading…"
                : filtered.length === 0
                  ? "0 lodges"
                  : `${filtered.length} lodge${filtered.length === 1 ? "" : "s"}${stateCount ? ` · ${stateCount} state${stateCount === 1 ? "" : "s"}` : ""}`}
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}{" "}
            <button
              type="button"
              className="font-bold underline"
              onClick={() => {
                setLoading(true);
                setError(null);
                getPublishedProperties()
                  .then((data) => {
                    setListings(Array.isArray(data) ? (data as ListingCardData[]) : []);
                    setError(null);
                  })
                  .catch(() => setError("Could not load listings. Please try again."))
                  .finally(() => setLoading(false));
              }}
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-emerald-200 bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-bold text-slate-900">
              {listings.length === 0 ? "No published lodges yet" : "No lodges match these filters"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {listings.length === 0
                ? "Agents are still publishing. You can browse freely — create an account to save interest or chat when homes appear."
                : "Try another state or budget. Clear filters to see all published homes."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedState("All States");
                  setPriceRange("all");
                  setSearchQuery("");
                }}
                className="rounded-xl border border-emerald-200 px-5 py-2.5 text-sm font-bold text-[#008A4B]"
              >
                Clear filters
              </button>
              <Link href="/signup" className="rounded-xl bg-[#008A4B] px-5 py-2.5 text-sm font-bold text-white">
                Create account
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">No rent held on this platform.</span> Pay the agent directly
          after you are satisfied. Need an account to chat or book a viewing?{" "}
          <Link href="/signup" className="font-bold text-[#008A4B]">
            Create a free corps member account
          </Link>
        </div>
      </main>
    </div>
  );
}
