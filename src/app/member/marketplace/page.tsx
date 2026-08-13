"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, ShoppingBag, Loader2, Navigation, ArrowLeft, List, Map } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

type Supermarket = {
  id: number;
  name: string;
  lat: number;
  lon: number;
  distance?: string;
  distanceKm?: number;
};

export default function MarketplacePage() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [markets, setMarkets] = useState<Supermarket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Supermarket | null>(null);
  const [view, setView] = useState<"list" | "map">("list");

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const routeLayerRef = useRef<string | null>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return { km: d, label: d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km` };
  };

  const findSupermarkets = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const query = `[out:json];node["shop"="supermarket"](around:5000,${lat},${lon});out;`;
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST", body: query,
      });
      const data = await res.json();
      const parsed: Supermarket[] = data.elements.map((el: any) => {
        const dist = calculateDistance(lat, lon, el.lat, el.lon);
        return { id: el.id, name: el.tags?.name || "Local Supermarket", lat: el.lat, lon: el.lon, distance: dist.label, distanceKm: dist.km };
      }).sort((a: Supermarket, b: Supermarket) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
      setMarkets(parsed);
    } catch {
      setError("Failed to fetch nearby supermarkets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    setLoading(true);
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lon } = coords;
        setUserLocation({ lat, lon });
        setView("map");
        findSupermarkets(lat, lon);
      },
      () => {
        setError("Location access denied. Please allow location access and try again.");
        setLoading(false);
      }
    );
  };

  // Init map when view switches to map
  useEffect(() => {
    if (view !== "map" || !mapContainerRef.current || !MAPBOX_TOKEN || !userLocation) return;
    if (mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [userLocation.lon, userLocation.lat],
      zoom: 14,
    });
    mapRef.current = map;

    // User location marker (blue pulsing dot)
    const el = document.createElement("div");
    el.className = "w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-lg";
    userMarkerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([userLocation.lon, userLocation.lat])
      .setPopup(new mapboxgl.Popup({ offset: 10 }).setHTML("<p class='text-xs font-bold'>📍 You are here</p>"))
      .addTo(map);

    // Add supermarket markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    markets.forEach((market) => {
      const popup = new mapboxgl.Popup({ offset: 10, closeButton: false }).setHTML(
        `<div class="p-1"><p class="font-bold text-sm">${market.name}</p><p class="text-xs text-gray-500">${market.distance} away</p></div>`
      );
      const markerEl = document.createElement("div");
      markerEl.className = "w-9 h-9 rounded-full bg-[#008A4B] border-2 border-white shadow-lg flex items-center justify-center cursor-pointer";
      markerEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;
      markerEl.addEventListener("click", () => setSelected(market));

      const marker = new mapboxgl.Marker({ element: markerEl })
        .setLngLat([market.lon, market.lat])
        .setPopup(popup)
        .addTo(map);
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, [view, userLocation, markets]);

  // Draw route to selected market
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selected || !userLocation) return;

    const drawRoute = async () => {
      try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${userLocation.lon},${userLocation.lat};${selected.lon},${selected.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
        const res = await fetch(url);
        const data = await res.json();
        const route = data.routes?.[0]?.geometry;
        if (!route) return;

        // Remove old route layer
        if (routeLayerRef.current && map.getLayer(routeLayerRef.current)) {
          map.removeLayer(routeLayerRef.current);
          map.removeSource(routeLayerRef.current);
        }

        const layerId = `route-${selected.id}`;
        routeLayerRef.current = layerId;

        if (map.isStyleLoaded()) {
          map.addSource(layerId, { type: "geojson", data: { type: "Feature", properties: {}, geometry: route } });
          map.addLayer({ id: layerId, type: "line", source: layerId, paint: { "line-color": "#008A4B", "line-width": 4, "line-opacity": 0.85 } });
        }

        // Fly to midpoint
        map.flyTo({ center: [selected.lon, selected.lat], zoom: 15, speed: 1.2 });
      } catch {
        // Silently fail — route is optional
      }
    };

    if (map.isStyleLoaded()) drawRoute();
    else map.on("load", drawRoute);
  }, [selected, userLocation]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      {/* Page header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#008A4B]/10 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-[#008A4B]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Local Marketplace</h1>
            <p className="text-xs text-gray-500">Supermarkets near you</p>
          </div>
        </div>
        {markets.length > 0 && (
          <div className="flex gap-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-xl">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${view === "list" ? "bg-white dark:bg-slate-600 shadow text-gray-900 dark:text-white" : "text-gray-500"}`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${view === "map" ? "bg-white dark:bg-slate-600 shadow text-gray-900 dark:text-white" : "text-gray-500"}`}
            >
              <Map className="w-3.5 h-3.5" /> Map
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Find button prompt */}
        {!userLocation && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-slate-700 max-w-md w-full text-center">
              <div className="w-20 h-20 bg-[#008A4B]/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <MapPin className="w-10 h-10 text-[#008A4B]" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Find Stores Near You</h3>
              <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                Allow location access to discover supermarkets and grocery stores within a 5km radius, with walking directions right inside the app.
              </p>
              <button
                onClick={requestLocation}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full bg-[#008A4B] text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-[#006F3C] transition shadow-md disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
                {loading ? "Locating..." : "Find Supermarkets Near Me"}
              </button>
              {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            </div>
          </div>
        )}

        {/* Map view */}
        {userLocation && view === "map" && (
          <div className="flex-1 flex flex-col" style={{ minHeight: "calc(100vh - 180px)" }}>
            <div ref={mapContainerRef} className="flex-1" style={{ minHeight: 400 }} />
            {/* Selected card overlay */}
            {selected && (
              <div className="bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 p-4 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#008A4B]/10 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-[#008A4B]" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{selected.name}</p>
                    <p className="text-xs text-gray-500">{selected.distance} walking distance</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            )}
            {!selected && markets.length > 0 && (
              <div className="bg-white dark:bg-slate-800 border-t border-gray-100 p-3">
                <p className="text-xs text-gray-500 text-center">Tap a marker to get walking directions</p>
              </div>
            )}
          </div>
        )}

        {/* List view */}
        {userLocation && view === "list" && (
          <div className="flex-1 overflow-y-auto p-4">
            {loading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[#008A4B]" />
              </div>
            )}
            {!loading && markets.length === 0 && (
              <div className="text-center py-16">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No supermarkets found within 5km.</p>
              </div>
            )}
            {!loading && markets.length > 0 && (
              <div className="space-y-3 max-w-4xl mx-auto">
                <p className="text-sm text-gray-500 mb-4">Found <span className="font-bold text-gray-900 dark:text-white">{markets.length}</span> supermarkets near you</p>
                {markets.map((market, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setSelected(market); setView("map"); }}
                    className="w-full bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-[#008A4B]/30 transition text-left flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-[#008A4B]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-6 h-6 text-[#008A4B]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{market.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Supermarket · Groceries</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs font-bold text-[#008A4B] bg-[#008A4B]/10 px-2 py-0.5 rounded-full">{market.distance}</span>
                      <span className="text-xs text-gray-400">Get Directions →</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
