"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Navigation, Clock, Ruler } from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface CommuteMapProps {
  propertyCoords: { lat: number; lng: number };
  ppaCoords: { lat: number; lng: number };
}

export default function CommuteMap({ propertyCoords, ppaCoords }: CommuteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const routeGeojsonRef = useRef<any>(null); // Store route data to re-apply on style change
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const bounds = new mapboxgl.LngLatBounds(
      [propertyCoords.lng, propertyCoords.lat],
      [ppaCoords.lng, ppaCoords.lat]
    );

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      bounds,
      fitBoundsOptions: { padding: 60 },
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    const addRouteLayers = () => {
      if (!map.getSource("route") && routeGeojsonRef.current) {
        map.addSource("route", { type: "geojson", data: routeGeojsonRef.current });
        
        map.addLayer({
          id: "route-glow",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#00ff88", "line-width": 12, "line-opacity": 0.15, "line-blur": 8 },
        });
        
        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#008A4B", "line-width": 4, "line-opacity": 0.95 },
        });
      }
    };

    // Re-add layers every time the style finishes loading (e.g. switching to satellite)
    map.on("style.load", addRouteLayers);

    map.on("load", async () => {
      // Property marker
      const propEl = document.createElement("div");
      propEl.innerHTML = `<div style="background:#008A4B;color:white;font-size:11px;font-weight:700;padding:5px 10px;border-radius:20px;box-shadow:0 4px 12px rgba(0,138,75,0.5);border:2px solid white;">🏠 Lodge</div>`;
      new mapboxgl.Marker({ element: propEl })
        .setLngLat([propertyCoords.lng, propertyCoords.lat])
        .addTo(map);

      // PPA marker
      const ppaEl = document.createElement("div");
      ppaEl.innerHTML = `<div style="background:#1e40af;color:white;font-size:11px;font-weight:700;padding:5px 10px;border-radius:20px;box-shadow:0 4px 12px rgba(30,64,175,0.5);border:2px solid white;">🎯 PPA</div>`;
      new mapboxgl.Marker({ element: ppaEl })
        .setLngLat([ppaCoords.lng, ppaCoords.lat])
        .addTo(map);

      // Fetch route
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${ppaCoords.lng},${ppaCoords.lat};${propertyCoords.lng},${propertyCoords.lat}?overview=full&geometries=geojson`
        );
        const data = await res.json();

        if (data.routes?.length) {
          const route = data.routes[0];
          const geojson = route.geometry;
          routeGeojsonRef.current = geojson; // Save for style toggles

          const distKm = (route.distance / 1000).toFixed(1);
          const mins = Math.round(route.duration / 60);
          setRouteInfo({ distance: `${distKm} km`, duration: `~${mins} min` });

          // Draw the route immediately
          addRouteLayers();

          // Fit to route
          const coords = geojson.coordinates as [number, number][];
          const routeBounds = coords.reduce(
            (b, c) => b.extend(c as mapboxgl.LngLatLike),
            new mapboxgl.LngLatBounds(coords[0], coords[0])
          );
          map.fitBounds(routeBounds, { padding: 60 });
        }
      } catch (err) {
        // Fallback straight line
        const fallbackGeojson = {
          type: "LineString",
          coordinates: [
            [ppaCoords.lng, ppaCoords.lat],
            [propertyCoords.lng, propertyCoords.lat],
          ],
        };
        routeGeojsonRef.current = fallbackGeojson;
        addRouteLayers();
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const toggleStyle = () => {
    if (!mapRef.current) return;
    const newStyle = isSatellite
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/satellite-streets-v12";
    
    mapRef.current.setStyle(newStyle);
    setIsSatellite(!isSatellite);
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-[280px] w-full flex items-center justify-center bg-secondary rounded-2xl border border-border">
        <p className="text-sm text-muted-foreground">⚠️ Add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Route stats */}
      {routeInfo && (
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5 shadow-sm">
            <Navigation className="w-4 h-4 text-[#008A4B]" />
            <div>
              <p className="text-xs text-muted-foreground">Distance</p>
              <p className="text-sm font-bold text-foreground">{routeInfo.distance}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5 shadow-sm">
            <Clock className="w-4 h-4 text-[#008A4B]" />
            <div>
              <p className="text-xs text-muted-foreground">Drive Time</p>
              <p className="text-sm font-bold text-foreground">{routeInfo.duration}</p>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="relative h-[280px] w-full rounded-2xl overflow-hidden border border-border shadow-inner">
        <div ref={mapContainerRef} className="h-full w-full" />

        {/* Style toggle */}
        <button
          onClick={toggleStyle}
          className="absolute top-3 right-3 z-10 bg-card/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold border border-border shadow-md hover:bg-card transition"
        >
          {isSatellite ? "🌙 Dark Map" : "🛰️ Satellite"}
        </button>
      </div>
    </div>
  );
}
