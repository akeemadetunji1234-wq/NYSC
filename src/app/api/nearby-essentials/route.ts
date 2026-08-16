import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SEARCH_RADIUS_METERS = 30_000;
const MAX_RESULTS = 25;
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const CATEGORY_CONFIG = {
  supermarket: {
    queries: ["supermarket", "grocery store", "shopping mall"],
    osmFilters: ['["shop"="supermarket"]', '["shop"="grocery"]', '["shop"="mall"]'],
  },
  restaurant: {
    queries: ["restaurant", "food", "fast food"],
    osmFilters: ['["amenity"="restaurant"]', '["amenity"="fast_food"]'],
  },
  market: {
    queries: ["market", "local market", "marketplace"],
    osmFilters: ['["amenity"="marketplace"]', '["shop"="market"]'],
  },
  pharmacy: {
    queries: ["pharmacy", "chemist", "drugstore"],
    osmFilters: ['["amenity"="pharmacy"]', '["shop"="chemist"]'],
  },
  store: {
    queries: ["convenience store", "shop", "retail store"],
    osmFilters: ['["shop"]', '["amenity"="fuel"]'],
  },
  hospital: {
    queries: ["hospital", "clinic", "medical center", "doctor"],
    osmFilters: ['["amenity"="hospital"]', '["amenity"="clinic"]', '["amenity"="doctors"]'],
  },
  bank: {
    queries: ["bank", "atm", "financial institution"],
    osmFilters: ['["amenity"="bank"]', '["amenity"="atm"]'],
  },
  transport: {
    queries: ["bus stop", "taxi station", "transport", "motor park"],
    osmFilters: ['["amenity"="bus_station"]', '["highway"="bus_stop"]', '["amenity"="taxi"]'],
  },
  security: {
    queries: ["police station", "security office", "checkpoint"],
    osmFilters: ['["amenity"="police"]', '["office"="security"]'],
  },
} as const;

type CategoryId = keyof typeof CATEGORY_CONFIG;
type Coordinates = { lat: number; lng: number };
type Place = {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  coordinates: Coordinates;
  source: "Mapbox" | "OpenStreetMap";
};

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

async function fetchJsonWithTimeout(url: string, init: RequestInit, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function fromMapbox(feature: any, index: number, origin: Coordinates): Place | null {
  const coordinates = feature?.geometry?.coordinates;
  const lng = coordinates?.[0];
  const lat = coordinates?.[1];
  const name = feature?.text || feature?.place_name;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !name) return null;

  const location = { lat, lng };
  return {
    id: `mapbox-${feature.id || index}`,
    name: String(name),
    address: String(feature.place_name || feature.properties?.address || "Address unavailable"),
    distanceKm: distanceInKm(origin, location),
    coordinates: location,
    source: "Mapbox",
  };
}

function fromOsm(element: any, index: number, origin: Coordinates): Place | null {
  const tags = element?.tags || {};
  const lat = element?.lat ?? element?.center?.lat;
  const lng = element?.lon ?? element?.center?.lon;
  const name = tags.name || tags.brand || tags.operator;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !name) return null;

  const location = { lat, lng };
  return {
    id: `osm-${element.type || "place"}-${element.id || index}`,
    name: String(name),
    address:
      [tags["addr:housenumber"], tags["addr:street"], tags["addr:suburb"], tags["addr:city"]]
        .filter(Boolean)
        .join(", ") || "Address unavailable",
    distanceKm: distanceInKm(origin, location),
    coordinates: location,
    source: "OpenStreetMap",
  };
}

async function searchMapbox(category: CategoryId, origin: Coordinates) {
  const token = process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
  if (!token) return [];

  const config = CATEGORY_CONFIG[category];
  const queries = [...config.queries, `${config.queries[0]} near me`];
  const responses = await Promise.allSettled(
    queries.map(async (query) => {
      const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
      url.searchParams.set("types", "poi");
      url.searchParams.set("country", "ng");
      url.searchParams.set("limit", "15");
      url.searchParams.set("proximity", `${origin.lng},${origin.lat}`);
      url.searchParams.set("access_token", token);
      const data = await fetchJsonWithTimeout(url.toString(), { method: "GET" });
      return Array.isArray(data?.features) ? data.features : [];
    }),
  );

  return responses.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}

async function searchOpenStreetMap(category: CategoryId, origin: Coordinates) {
  const filters = CATEGORY_CONFIG[category].osmFilters
    .map((filter) => `nwr${filter}(around:${SEARCH_RADIUS_METERS},${origin.lat},${origin.lng});`)
    .join("");
  const query = `[out:json][timeout:25];(${filters});out center tags;`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const data = await fetchJsonWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: {
            "content-type": "text/plain;charset=UTF-8",
            accept: "application/json",
            "user-agent": "NeatAffordableNearbyEssentials/1.0",
          },
          body: query,
        },
        15_000,
      );
      if (data && Array.isArray(data.elements)) return data.elements;
    } catch {
      // Try the next Overpass mirror.
    }
  }

  return [];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as CategoryId | null;
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!category || !(category in CATEGORY_CONFIG) || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Invalid nearby search parameters" }, { status: 400 });
  }

  const origin = { lat, lng };
  const [mapboxResult, osmResult] = await Promise.allSettled([
    searchMapbox(category, origin),
    searchOpenStreetMap(category, origin),
  ]);

  const places: Place[] = [];
  const seen = new Set<string>();
  const addPlace = (place: Place | null) => {
    if (!place || place.distanceKm > SEARCH_RADIUS_METERS / 1000) return;
    const key = `${place.name.toLowerCase()}-${place.coordinates.lat.toFixed(4)}-${place.coordinates.lng.toFixed(4)}`;
    if (seen.has(key)) return;
    seen.add(key);
    places.push(place);
  };

  if (mapboxResult.status === "fulfilled") {
    mapboxResult.value.forEach((feature, index) => addPlace(fromMapbox(feature, index, origin)));
  }
  if (osmResult.status === "fulfilled") {
    osmResult.value.forEach((element, index) => addPlace(fromOsm(element, index, origin)));
  }

  places.sort((a, b) => a.distanceKm - b.distanceKm);

  return NextResponse.json(
    { places: places.slice(0, MAX_RESULTS), radiusKm: SEARCH_RADIUS_METERS / 1000 },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
