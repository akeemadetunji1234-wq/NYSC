"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// Nigeria bounding box
const NIGERIA_BOUNDS: mapboxgl.LngLatBoundsLike = [[2.6765, 4.2406], [14.6799, 13.8659]];
const NIGERIA_CENTER: [number, number] = [8.6753, 9.082];

interface Property {
  id: string;
  name: string;
  location: string;
  price: string;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
  distanceMins: number | null;
  image: string;
  type: string;
  state: string;
}

interface PropertyMapProps {
  properties: Property[];
  userPpa: { lat: number; lng: number; area: string } | null;
}

export default function PropertyMap({ properties, userPpa }: PropertyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const routeLayerRef = useRef<string | null>(null);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);

  const mappableProperties = properties.filter(p => p.latitude && p.longitude);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const center: [number, number] = userPpa
      ? [userPpa.lng, userPpa.lat]
      : mappableProperties.length > 0 && mappableProperties[0].longitude && mappableProperties[0].latitude
      ? [mappableProperties[0].longitude!, mappableProperties[0].latitude!]
      : NIGERIA_CENTER;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center,
      zoom: userPpa ? 11 : 6,
      maxBounds: NIGERIA_BOUNDS,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    map.on("load", () => {
      // Add PPA marker
      if (userPpa) {
        const ppaEl = document.createElement("div");
        ppaEl.innerHTML = `<div style="background:#1e40af;color:white;font-size:11px;font-weight:700;padding:5px 10px;border-radius:20px;white-space:nowrap;box-shadow:0 4px 12px rgba(30,64,175,0.5);border:2px solid white;">🎯 My PPA</div>`;

        new mapboxgl.Marker({ element: ppaEl })
          .setLngLat([userPpa.lng, userPpa.lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding:8px;">
              <p style="font-weight:700;color:#1e40af;margin:0;">Your PPA</p>
              <p style="color:#666;font-size:12px;margin:4px 0 0;">${userPpa.area}</p>
            </div>
          `))
          .addTo(map);
      }

      // Add property markers
      mappableProperties.forEach((p) => {
        const el = document.createElement("div");
        el.innerHTML = `<div style="background:#008A4B;color:white;font-size:11px;font-weight:700;padding:4px 9px;border-radius:20px;white-space:nowrap;box-shadow:0 4px 12px rgba(0,138,75,0.5);border:2px solid white;cursor:pointer;">📍</div>`;

        const popup = new mapboxgl.Popup({ offset: 25, maxWidth: "240px" }).setHTML(`
          <div style="padding:6px;">
            <img src="${p.image}" style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />
            <p style="font-weight:700;font-size:13px;margin:0 0 2px;">${p.name}</p>
            <p style="font-size:11px;color:#666;margin:0 0 4px;">${p.location}</p>
            ${p.distanceKm !== null ? `<p style="font-size:11px;font-weight:700;color:#008A4B;margin:0 0 4px;">📍 ${p.distanceKm} km · ~${p.distanceMins} min from PPA</p>` : ""}
            <p style="font-weight:700;color:#008A4B;margin:0 0 8px;">${p.price}<span style="color:#999;font-weight:400;">/yr</span></p>
            <a href="/member/listing/${p.id}" style="display:block;text-align:center;background:#008A4B;color:white;font-size:12px;font-weight:700;padding:7px;border-radius:8px;text-decoration:none;">View Property</a>
          </div>
        `);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([p.longitude!, p.latitude!])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);

        // Click marker → fetch route
        el.addEventListener("click", () => {
          if (userPpa && activeRouteId !== p.id) {
            fetchRoute(map, userPpa.lng, userPpa.lat, p.longitude!, p.latitude!, p.id);
            setActiveRouteId(p.id);
          }
          marker.togglePopup();
        });
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  async function fetchRoute(
    map: mapboxgl.Map,
    fromLng: number, fromLat: number,
    toLng: number, toLat: number,
    propertyId: string
  ) {
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`
      );
      const data = await res.json();

      if (!data.routes?.length) return;

      const geojson = data.routes[0].geometry;

      // Remove existing route layer
      if (routeLayerRef.current) {
        if (map.getLayer("route")) map.removeLayer("route");
        if (map.getLayer("route-glow")) map.removeLayer("route-glow");
        if (map.getSource("route")) map.removeSource("route");
      }

      // Add route source & layers
      map.addSource("route", { type: "geojson", data: geojson });

      // Glow layer
      map.addLayer({
        id: "route-glow",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#00ff88", "line-width": 10, "line-opacity": 0.2, "line-blur": 6 },
      });

      // Main route line
      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#008A4B", "line-width": 4, "line-opacity": 0.9, "line-dasharray": [0, 2] },
      });

      routeLayerRef.current = "route";

      // Fit map to route
      const coords = geojson.coordinates as [number, number][];
      const bounds = coords.reduce(
        (b, c) => b.extend(c as mapboxgl.LngLatLike),
        new mapboxgl.LngLatBounds(coords[0], coords[0])
      );
      map.fitBounds(bounds, { padding: 60 });
    } catch (err) {
      console.error("Route fetch failed:", err);
    }
  }

  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-secondary rounded-xl border border-border">
        <p className="text-sm text-muted-foreground font-medium">⚠️ Add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden">
      <div ref={mapContainerRef} className="h-full w-full" />

      {mappableProperties.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-card px-6 py-4 rounded-2xl shadow-xl border border-border text-center">
            <p className="font-bold text-muted-foreground">No properties with map pins yet</p>
            <p className="text-xs text-slate-400 mt-1">Agents need to pin their properties on the map</p>
          </div>
        </div>
      )}

      {userPpa && mappableProperties.length > 0 && (
        <div className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm px-3 py-2 rounded-xl border border-border shadow-md pointer-events-none">
          <p className="text-xs font-semibold text-muted-foreground">Click any 📍 to see commute route</p>
        </div>
      )}
    </div>
  );
}
