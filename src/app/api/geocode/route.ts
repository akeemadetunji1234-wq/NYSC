import { NextRequest, NextResponse } from "next/server";
import { getClientIp, rateLimit } from "../../../lib/rateLimit";
import { safeOutboundFetch } from "../../../lib/safeOutboundFetch";
import { buildGeocodeQueries, dedupeGeocodeHits, proximityForArea, type GeocodeHit } from "../../../lib/ppaGeocode";

const ALLOWED_HOSTS = ["api.mapbox.com", "nominatim.openstreetmap.org"] as const;

async function readJson(url: string, init?: RequestInit) {
  const response = await safeOutboundFetch(url, { ...init, cache: "no-store" }, {
    allowedHosts: ALLOWED_HOSTS,
    timeoutMs: 4_500,
    maxResponseBytes: 750_000,
  });
  if (!response.ok) return null;
  return response.json();
}

function fromMapboxV6(payload: { features?: Array<{ geometry?: { coordinates?: number[] }; properties?: { mapbox_id?: string; name?: string; full_address?: string; place_formatted?: string } }> }, offset: number): GeocodeHit[] {
  return (payload.features || []).map((feature, index) => {
    const [lng, lat] = feature.geometry?.coordinates || [];
    const properties = feature.properties || {};
    const label = properties.full_address || [properties.name, properties.place_formatted].filter(Boolean).join(", ");
    return { id: properties.mapbox_id || `mapbox-v6-${offset + index}`, label, lng, lat };
  });
}

function fromMapboxV5(payload: { features?: Array<{ id?: string; place_name?: string; text?: string; center?: number[] }> }, offset: number): GeocodeHit[] {
  return (payload.features || []).map((feature, index) => ({
    id: feature.id || `mapbox-v5-${offset + index}`,
    label: feature.place_name || feature.text || "",
    lng: feature.center?.[0] ?? Number.NaN,
    lat: feature.center?.[1] ?? Number.NaN,
  }));
}

function fromNominatim(payload: Array<{ place_id?: number; display_name?: string; lon?: string; lat?: string }>, offset: number): GeocodeHit[] {
  return payload.map((place, index) => ({
    id: `osm-${place.place_id || offset + index}`,
    label: place.display_name || "",
    lng: Number(place.lon),
    lat: Number(place.lat),
  }));
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  const area = request.nextUrl.searchParams.get("area")?.trim() || "";
  const proximity = proximityForArea(area, request.nextUrl.searchParams.get("proximity"));
  const variants = buildGeocodeQueries(query, area);
  if (!variants.length) return NextResponse.json({ results: [] });

  const ip = getClientIp(request);
  const limit = await rateLimit(`geocode:ip:${ip}`, 40, 15 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json(
      { results: [], error: "Too many address searches. Wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const token = process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
  const hits: GeocodeHit[] = [];

  try {
    for (const variant of variants) {
      if (token && dedupeGeocodeHits(hits).length < 5) {
        const v6 = new URL("https://api.mapbox.com/search/geocode/v6/forward");
        v6.searchParams.set("q", variant);
        v6.searchParams.set("country", "ng");
        v6.searchParams.set("limit", "5");
        v6.searchParams.set("autocomplete", "true");
        v6.searchParams.set("proximity", proximity);
        v6.searchParams.set("access_token", token);
        const v6Payload = await readJson(v6.toString());
        if (v6Payload) hits.push(...fromMapboxV6(v6Payload, hits.length));
      }

      if (token && dedupeGeocodeHits(hits).length < 5) {
        const v5 = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(variant)}.json`);
        v5.searchParams.set("access_token", token);
        v5.searchParams.set("country", "ng");
        v5.searchParams.set("autocomplete", "true");
        v5.searchParams.set("fuzzyMatch", "true");
        v5.searchParams.set("language", "en");
        v5.searchParams.set("limit", "5");
        v5.searchParams.set("proximity", proximity);
        const v5Payload = await readJson(v5.toString());
        if (v5Payload) hits.push(...fromMapboxV5(v5Payload, hits.length));
      }

      if (dedupeGeocodeHits(hits).length >= 5) break;
    }

    if (dedupeGeocodeHits(hits).length < 3) {
      const nominatim = new URL("https://nominatim.openstreetmap.org/search");
      nominatim.searchParams.set("format", "jsonv2");
      nominatim.searchParams.set("q", variants[variants.length - 1]);
      nominatim.searchParams.set("countrycodes", "ng");
      nominatim.searchParams.set("limit", "5");
      nominatim.searchParams.set("addressdetails", "0");
      const osmPayload = await readJson(nominatim.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "NeatAffordable/1.0 (NYSC PPA address search)",
        },
      });
      if (Array.isArray(osmPayload)) hits.push(...fromNominatim(osmPayload, hits.length));
    }
  } catch (error) {
    console.error("PPA geocode failed", error);
  }

  return NextResponse.json({ results: dedupeGeocodeHits(hits) }, { headers: { "Cache-Control": "no-store" } });
}
