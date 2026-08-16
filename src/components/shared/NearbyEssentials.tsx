"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  LocateFixed,
  MapPin,
  Navigation,
  Pill,
  RefreshCw,
  ShoppingBag,
  ShoppingBasket,
  Store,
  Utensils,
} from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface Coordinates {
  lat: number;
  lng: number;
}

interface NearbyEssentialsProps {
  propertyCoords?: Coordinates | null;
  propertyLabel?: string;
  title?: string;
}

type CategoryId = "supermarket" | "restaurant" | "market" | "pharmacy" | "store";

type NearbyPlace = {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  coordinates: Coordinates;
};

const CATEGORIES: Array<{
  id: CategoryId;
  label: string;
  query: string;
  icon: typeof ShoppingBasket;
}> = [
  { id: "supermarket", label: "Supermarkets", query: "supermarket", icon: ShoppingBasket },
  { id: "restaurant", label: "Restaurants", query: "restaurant", icon: Utensils },
  { id: "market", label: "Local markets", query: "market", icon: Store },
  { id: "pharmacy", label: "Pharmacies", query: "pharmacy", icon: Pill },
  { id: "store", label: "Other stores", query: "convenience store", icon: ShoppingBag },
];

function distanceInKm(from: Coordinates, to: Coordinates) {
  const earthRadiusKm = 6371;
  const latDelta = ((to.lat - from.lat) * Math.PI) / 180;
  const lngDelta = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(lngDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function mapsSearchUrl(place: NearbyPlace) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.address}`)}`;
}

export function NearbyEssentials({
  propertyCoords,
  propertyLabel = "this lodge",
  title = "Nearby daily essentials",
}: NearbyEssentialsProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("supermarket");
  const [locationMode, setLocationMode] = useState<"property" | "current">("property");
  const [currentCoords, setCurrentCoords] = useState<Coordinates | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchNonce, setSearchNonce] = useState(0);

  const selectedCategory = useMemo(
    () => CATEGORIES.find((category) => category.id === activeCategory) || CATEGORIES[0],
    [activeCategory],
  );
  const selectedCoords = locationMode === "property" ? propertyCoords : currentCoords;
  const selectedLocationLabel = locationMode === "property" ? propertyLabel : "your current location";

  useEffect(() => {
    if (!selectedCoords || !MAPBOX_TOKEN) {
      setPlaces([]);
      setIsLoading(false);
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setPlaces([]);
      setError("You appear to be offline. Reconnect to search for nearby places.");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);

    async function searchNearbyPlaces() {
      setIsLoading(true);
      setError(null);
      try {
        const query = encodeURIComponent(selectedCategory.query);
        const proximity = `${selectedCoords.lng},${selectedCoords.lat}`;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?types=poi&country=ng&limit=8&proximity=${proximity}&access_token=${encodeURIComponent(MAPBOX_TOKEN)}`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`Nearby search failed with status ${response.status}`);

        const data = await response.json();
        const nextPlaces: NearbyPlace[] = (Array.isArray(data?.features) ? data.features : [])
          .map((feature: any, index: number) => {
            const [lng, lat] = Array.isArray(feature?.geometry?.coordinates)
              ? feature.geometry.coordinates
              : [];
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            return {
              id: String(feature.id || `${activeCategory}-${index}`),
              name: String(feature.text || feature.place_name || "Nearby place"),
              address: String(feature.place_name || feature.properties?.address || "Address unavailable"),
              distanceKm: distanceInKm(selectedCoords, { lat, lng }),
              coordinates: { lat, lng },
            } satisfies NearbyPlace;
          })
          .filter((place): place is NearbyPlace => Boolean(place))
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .slice(0, 6);

        setPlaces(nextPlaces);
        if (nextPlaces.length === 0) {
          setError(`No ${selectedCategory.label.toLowerCase()} were found near ${selectedLocationLabel}.`);
        }
      } catch (searchError) {
        if (controller.signal.aborted) {
          setError("The nearby search took too long. Please try again.");
        } else {
          console.error("Nearby essentials search failed:", searchError);
          setError("Nearby places are temporarily unavailable. Check your connection and try again.");
        }
        setPlaces([]);
      } finally {
        window.clearTimeout(timeout);
        setIsLoading(false);
      }
    }

    searchNearbyPlaces();
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [activeCategory, selectedCoords, selectedLocationLabel, selectedCategory.label, searchNonce]);

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Location access is not supported by this browser.");
      return;
    }

    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationMode("current");
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setError("We could not access your location. Allow location access or use the lodge location instead.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  if (!MAPBOX_TOKEN) {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <h2 className="font-bold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Add NEXT_PUBLIC_MAPBOX_TOKEN to enable nearby place search.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6" aria-label={title}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-emerald-50 p-2 dark:bg-emerald-950/30">
              <ShoppingBasket className="h-5 w-5 text-[#008A4B]" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Find essentials and everyday services close to where you stay.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLocationMode("property")}
            disabled={!propertyCoords}
            className={`rounded-full px-3 py-2 text-xs font-semibold transition ${locationMode === "property" ? "bg-[#008A4B] text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Near {propertyLabel}
          </button>
          <button
            type="button"
            onClick={requestCurrentLocation}
            disabled={isLocating}
            className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition ${locationMode === "current" ? "bg-[#008A4B] text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"} disabled:cursor-wait disabled:opacity-70`}
          >
            <LocateFixed className="h-3.5 w-3.5" />
            {isLocating ? "Locating..." : "Near me"}
          </button>
        </div>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Nearby place categories">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <button
              type="button"
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              role="tab"
              aria-selected={activeCategory === category.id}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${activeCategory === category.id ? "border-[#008A4B] bg-emerald-50 text-[#008A4B] dark:bg-emerald-950/30" : "border-border bg-card text-muted-foreground hover:bg-secondary"}`}
            >
              <Icon className="h-4 w-4" />
              {category.label}
            </button>
          );
        })}
      </div>

      {!selectedCoords ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border p-6 text-center">
          <MapPin className="mx-auto h-7 w-7 text-slate-400" />
          <p className="mt-2 font-semibold text-foreground">Choose a location to search nearby</p>
          <p className="mt-1 text-sm text-muted-foreground">Set a lodge location or allow access to your current location.</p>
        </div>
      ) : isLoading ? (
        <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-secondary p-8 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" /> Searching {selectedCategory.label.toLowerCase()} near {selectedLocationLabel}...
        </div>
      ) : error && places.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{error}</p>
              <p className="mt-1 text-xs text-muted-foreground">No locations are fabricated or cached when the provider is unavailable.</p>
              <button type="button" onClick={() => setSearchNonce((current) => current + 1)} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#008A4B]">
                <RefreshCw className="h-3.5 w-3.5" /> Try again
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-muted-foreground">Showing real nearby results near {selectedLocationLabel}</p>
            {error && <span className="text-[11px] text-amber-700">{error}</span>}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {places.map((place) => (
              <a
                key={place.id}
                href={mapsSearchUrl(place)}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-border p-4 transition hover:border-[#008A4B] hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-foreground">{place.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{place.address}</p>
                  </div>
                  <Navigation className="h-4 w-4 shrink-0 text-[#008A4B]" />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#008A4B]">{place.distanceKm < 1 ? `${Math.round(place.distanceKm * 1000)} m` : `${place.distanceKm.toFixed(1)} km`} away</span>
                  <span className="text-muted-foreground group-hover:text-[#008A4B]">Open directions</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default NearbyEssentials;
