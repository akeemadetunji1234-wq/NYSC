"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { AlertCircle, Clock, MapPin, Navigation, RefreshCw, X } from "lucide-react";
import { createMapLabel } from "../../lib/mapLabel";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

type Coordinates = { lat: number; lng: number };

type NearbyEssentialsMapProps = {
  origin: Coordinates;
  destination: Coordinates;
  placeName: string;
  onClose: () => void;
};

type Route = {
  distance: number;
  duration: number;
  geometry: { type: "LineString"; coordinates: [number, number][] };
};

export default function NearbyEssentialsMap({
  origin,
  destination,
  placeName,
  onClose,
}: NearbyEssentialsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const routeRef = useRef<Route["geometry"] | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mapContainerRef.current || !MAPBOX_TOKEN) {
      setIsLoading(false);
      setError("Map directions are unavailable because the map service is not configured.");
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const bounds = new mapboxgl.LngLatBounds(
      [origin.lng, origin.lat],
      [destination.lng, destination.lat],
    );
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      bounds,
      fitBoundsOptions: { padding: 56, maxZoom: 15 },
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    const addRoute = () => {
      if (!routeRef.current || map.getSource("nearby-route")) return;
      map.addSource("nearby-route", { type: "geojson", data: routeRef.current });
      map.addLayer({
        id: "nearby-route-outline",
        type: "line",
        source: "nearby-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.75 },
      });
      map.addLayer({
        id: "nearby-route-line",
        type: "line",
        source: "nearby-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#008A4B", "line-width": 4, "line-opacity": 0.95 },
      });
    };

    map.on("style.load", addRoute);
    map.on("load", () => {
      const originEl = createMapLabel({
        text: "You are here",
        background: "#1e40af",
        shadow: "0 3px 10px rgba(30,64,175,.35)",
      });
      new mapboxgl.Marker({ element: originEl })
        .setLngLat([origin.lng, origin.lat])
        .addTo(map);

      const destinationEl = createMapLabel({
        text: "Destination",
        background: "#008A4B",
        shadow: "0 3px 10px rgba(0,138,75,.35)",
      });
      new mapboxgl.Marker({ element: destinationEl })
        .setLngLat([destination.lng, destination.lat])
        .addTo(map);

      const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
      const fetchRoute = async (url: string) => {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 10000);
        try {
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) throw new Error(`Routing service returned HTTP ${response.status}`);
          const data = await response.json();
          const candidate = data?.routes?.[0];
          if (!candidate?.geometry?.coordinates?.length) throw new Error("No usable street route was returned");
          return candidate as Route;
        } finally {
          window.clearTimeout(timeout);
        }
      };

      void (async () => {
        try {
          let nextRoute: Route;
          try {
            nextRoute = await fetchRoute(
              `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?access_token=${encodeURIComponent(MAPBOX_TOKEN)}&overview=full&geometries=geojson`,
            );
          } catch (mapboxError) {
            console.warn("Mapbox nearby route failed; trying OSRM", mapboxError);
            nextRoute = await fetchRoute(
              `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`,
            );
          }
          routeRef.current = nextRoute.geometry;
          setRoute(nextRoute);
          setError(null);
          addRoute();
          const routeBounds = nextRoute.geometry.coordinates.reduce(
            (currentBounds, point) => currentBounds.extend(point as mapboxgl.LngLatLike),
            new mapboxgl.LngLatBounds(nextRoute.geometry.coordinates[0], nextRoute.geometry.coordinates[0]),
          );
          map.fitBounds(routeBounds, { padding: 56, maxZoom: 15 });
        } catch (routeError) {
          console.error("Nearby street routing failed", routeError);
          setError("Street directions are temporarily unavailable. The location markers are still shown.");
        } finally {
          setIsLoading(false);
        }
      })();
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [origin.lat, origin.lng, destination.lat, destination.lng]);

  return (
    <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Navigation className="h-4 w-4 text-[#008A4B]" /> Directions to {placeName}
          </p>
          {route && (
            <p className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Navigation className="h-3.5 w-3.5" />{(route.distance / 1000).toFixed(1)} km by road</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />~{Math.max(1, Math.round(route.duration / 60))} min</span>
            </p>
          )}
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-white hover:text-foreground" aria-label="Close directions">
          <X className="h-4 w-4" />
        </button>
      </div>
      {isLoading && <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"><RefreshCw className="h-3.5 w-3.5 animate-spin" />Loading street directions...</p>}
      {error && <p className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
      <div className="relative h-[280px] overflow-hidden rounded-xl border border-border bg-secondary">
        <div ref={mapContainerRef} className="h-full w-full" />
        {!MAPBOX_TOKEN && <div className="absolute inset-0 flex items-center justify-center p-5 text-center text-xs text-muted-foreground"><MapPin className="mr-2 h-4 w-4" />Add NEXT_PUBLIC_MAPBOX_TOKEN to display the in-app map.</div>}
      </div>
    </div>
  );
}

export type { Coordinates as NearbyEssentialsCoordinates };
