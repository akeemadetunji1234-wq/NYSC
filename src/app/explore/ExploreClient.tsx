"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, MapPin, Search, ShieldCheck, ArrowRight } from "lucide-react";
import { getPublishedProperties } from "../actions/property";

const NIGERIAN_STATES = [
  "All States", "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
  "Yobe", "Zamfara",
];

const PRICE_RANGES = [
  { label: "Any Price", value: "all" },
  { label: "Under ₦100k", value: "under100k" },
  { label: "₦100k – ₦200k", value: "100k-200k" },
  { label: "₦200k – ₦400k", value: "200k-400k" },
  { label: "Over ₦400k", value: "over400k" },
];

type PublicListing = {
  id: string;
  title: string;
  location: string;
  state: string | null;
  lga: string | null;
  price: number;
  bedrooms: number;
  images: string[];
  agent?: { name?: string | null; agentVerified?: boolean | null } | null;
};

export function ExploreClient() {
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("All States");
  const [priceRange, setPriceRange] = useState("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getPublishedProperties();
        if (!cancelled) setListings(data as PublicListing[]);
      } catch (error) {
        console.error(error);
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

  return (
    <div className="min-h-screen bg-[#f6f8f6] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#008A4B]">
              <Home className="h-4 w-4 text-white" />
            </div>
            <span className="font-black text-lg">Neat & Affordable</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/signin" className="text-sm font-semibold text-slate-600 hover:text-[#008A4B]">
              Sign In
            </Link>
            <Link href="/signup" className="rounded-xl bg-[#008A4B] px-4 py-2 text-sm font-bold text-white hover:bg-[#006e3c]">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
        <section className="rounded-3xl bg-[#008A4B] p-6 text-white shadow-lg md:p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Browse without signing in</p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">Find a safer home near your PPA</h1>
          <p className="mt-2 max-w-2xl text-sm text-emerald-50">
            Filter by state, budget, and area first. Create an account only when you want to chat, save, or request a viewing.
          </p>
          <div className="mt-6 grid gap-3 rounded-2xl bg-white p-3 text-slate-900 md:grid-cols-[1fr_180px_180px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search area, lodge, or LGA"
                className="w-full rounded-xl bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none ring-0"
              />
            </div>
            <select
              value={selectedState}
              onChange={(event) => setSelectedState(event.target.value)}
              className="rounded-xl bg-slate-50 px-3 py-3 text-sm"
            >
              {NIGERIAN_STATES.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <select
              value={priceRange}
              onChange={(event) => setPriceRange(event.target.value)}
              className="rounded-xl bg-slate-50 px-3 py-3 text-sm"
            >
              {PRICE_RANGES.map((range) => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
            <div className="flex items-center justify-center rounded-xl bg-[#006e3c] px-4 py-3 text-sm font-bold text-white">
              {filtered.length} home{filtered.length === 1 ? "" : "s"}
            </div>
          </div>
        </section>

        {loading ? (
          <p className="py-16 text-center text-sm text-slate-500">Loading live listings...</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-emerald-200 bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-bold">No public listings in this filter yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              We are onboarding verified agents. Create a free account to save your posting state and get notified when homes appear.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/signup" className="rounded-xl bg-[#008A4B] px-5 py-2.5 text-sm font-bold text-white">
                Create free account
              </Link>
              <Link href="/signup?role=agent" className="rounded-xl border border-emerald-200 px-5 py-2.5 text-sm font-bold text-[#008A4B]">
                List a property
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((listing) => (
              <Link
                key={listing.id}
                href={`/explore/${listing.id}`}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative h-44 bg-slate-100">
                  {listing.images[0] ? (
                    <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <Home className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-bold leading-snug">{listing.title}</h2>
                    <p className="shrink-0 font-black text-[#008A4B]">₦{listing.price.toLocaleString()}</p>
                  </div>
                  <p className="flex items-center gap-1 text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {listing.lga ? `${listing.lga}, ` : ""}{listing.state || listing.location}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                    <span>{listing.bedrooms} bedroom{listing.bedrooms === 1 ? "" : "s"}</span>
                    {listing.agent?.agentVerified ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5" /> Verified agent
                      </span>
                    ) : (
                      <span>Agent listed</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 text-sm text-slate-600">
          Ready to chat or book a viewing?{" "}
          <Link href="/signup" className="font-bold text-[#008A4B]">
            Create a corps member account <ArrowRight className="ml-1 inline h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
