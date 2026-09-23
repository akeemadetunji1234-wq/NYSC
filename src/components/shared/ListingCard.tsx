import Link from "next/link";
import Image from "next/image";
import { Home, MapPin, ShieldCheck, Zap, Navigation } from "lucide-react";

export type ListingCardData = {
  id: string;
  title: string;
  location: string;
  state: string | null;
  lga: string | null;
  price: number;
  bedrooms?: number;
  images: string[];
  amenities?: string[];
  agent?: { name?: string | null; agentVerified?: boolean | null } | null;
  /** Optional precomputed distance label e.g. "~2.4 km to PPA" */
  ppaDistanceLabel?: string | null;
};

function powerChip(amenities?: string[]) {
  if (!amenities?.length) return null;
  const joined = amenities.join(" ").toLowerCase();
  if (joined.includes("24") || joined.includes("inverter") || joined.includes("solar")) {
    return { label: "Strong power", tone: "emerald" as const };
  }
  if (joined.includes("generator") || joined.includes("power")) {
    return { label: "Power noted", tone: "amber" as const };
  }
  return null;
}

export function ListingCard({
  listing,
  href,
}: {
  listing: ListingCardData;
  href?: string;
}) {
  const link = href ?? `/explore/${listing.id}`;
  const place = [listing.lga, listing.state].filter(Boolean).join(" · ") || listing.location;
  const power = powerChip(listing.amenities);
  const verified = Boolean(listing.agent?.agentVerified);

  return (
    <Link
      href={link}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
    >
      <div className="relative h-44 shrink-0 bg-slate-100">
        {listing.images[0] ? (
          <Image
            src={listing.images[0]}
            alt={listing.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <Home className="h-10 w-10" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-lg font-black tabular-nums text-[#008A4B]">
            ₦{listing.price.toLocaleString()}
            <span className="ml-1 text-xs font-semibold text-slate-500">/ year</span>
          </p>
          {listing.bedrooms != null && (
            <span className="shrink-0 rounded-full bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
              {listing.bedrooms} bed{listing.bedrooms === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <h2 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900">{listing.title}</h2>

        {listing.ppaDistanceLabel ? (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
            <Navigation className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{listing.ppaDistanceLabel}</span>
          </p>
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          {power && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                power.tone === "emerald"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-800"
              }`}
            >
              <Zap className="h-3 w-3" />
              {power.label}
            </span>
          )}
          {verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              <ShieldCheck className="h-3 w-3" />
              Verified agent
            </span>
          )}
        </div>

        <p className="mt-auto flex min-w-0 items-start gap-1 pt-1 text-xs text-slate-500">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="break-words">{place}</span>
        </p>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="h-44 animate-pulse bg-slate-100" />
      <div className="space-y-2 p-4">
        <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}
