"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { MapPin, Search } from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// Nigeria bounding box [west, south, east, north]
const NIGERIA_BBOX: [number, number, number, number] = [2.6765, 4.2406, 14.6799, 13.8659];
const NIGERIA_CENTER: [number, number] = [8.6753, 9.082]; // [lng, lat]

interface MapPickerProps {
  initialPosition?: { lat: number; lng: number };
  onPositionChange: (pos: { lat: number; lng: number }) => void;
}

export default function MapPicker({ initialPosition, onPositionChange }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const geocoderRef = useRef<MapboxGeocoder | null>(null);
  const geocoderContainerRef = useRef<HTMLDivElement>(null);
  const [pickedCoords, setPickedCoords] = useState<{ lat: number; lng: number } | null>(
    initialPosition || null
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    if (!MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: initialPosition ? [initialPosition.lng, initialPosition.lat] : NIGERIA_CENTER,
      zoom: initialPosition ? 13 : 6,
      maxBounds: [
        [NIGERIA_BBOX[0] - 0.5, NIGERIA_BBOX[1] - 0.5],
        [NIGERIA_BBOX[2] + 0.5, NIGERIA_BBOX[3] + 0.5],
      ],
    });

    mapRef.current = map;

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    // Add Geocoder (address search) restricted to Nigeria
    const geocoder = new MapboxGeocoder({
      accessToken: MAPBOX_TOKEN,
      mapboxgl: mapboxgl as any,
      countries: "ng", // Nigeria only
      bbox: NIGERIA_BBOX,
      placeholder: "Search for address in Nigeria...",
      marker: false,
    });

    geocoderRef.current = geocoder;

    if (geocoderContainerRef.current) {
      geocoder.addTo(geocoderContainerRef.current);
    }

    // When geocoder result is selected
    geocoder.on("result", (e) => {
      const [lng, lat] = e.result.center;
      if (mapRef.current) placeMarker(lng, lat, mapRef.current);
    });

    // Place initial marker if position exists
    if (initialPosition) {
      placeMarker(initialPosition.lng, initialPosition.lat, map);
    }

    // Click on map to place/move marker
    map.on("click", (e) => {
      if (mapRef.current) placeMarker(e.lngLat.lng, e.lngLat.lat, mapRef.current);
    });

    return () => {
      if (geocoderRef.current) {
        geocoderRef.current.onRemove();
      }
      if (geocoderContainerRef.current) {
        geocoderContainerRef.current.innerHTML = "";
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  function placeMarker(lng: number, lat: number, map: mapboxgl.Map) {
    if (!map || !map.getCanvasContainer()) return;
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Custom styled marker
    const el = document.createElement("div");
    el.className = "mapbox-custom-marker";
    el.style.cssText = `
      width: 36px;
      height: 36px;
      background: #008A4B;
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 14px rgba(0,138,75,0.5);
      cursor: pointer;
    `;

    const marker = new mapboxgl.Marker({ element: el, draggable: true })
      .setLngLat([lng, lat])
      .addTo(map);

    markerRef.current = marker;

    const newPos = { lat, lng };
    setPickedCoords(newPos);
    onPositionChange(newPos);

    // On drag end, update position
    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      const dragged = { lat: lngLat.lat, lng: lngLat.lng };
      setPickedCoords(dragged);
      onPositionChange(dragged);
    });

    map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 14) });
  }

  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-[320px] w-full rounded-xl border border-dashed border-amber-400 bg-amber-50 flex flex-col items-center justify-center gap-2">
        <MapPin className="w-8 h-8 text-amber-500" />
        <p className="text-sm font-semibold text-amber-700">Mapbox Token Missing</p>
        <p className="text-xs text-amber-600">Add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Geocoder Search Bar */}
      <div ref={geocoderContainerRef} className="w-full mapbox-geocoder-wrapper" />

      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-border shadow-md" style={{ height: "320px" }}>
        <div ref={mapContainerRef} className="h-full w-full" />

        {/* Helper text overlay */}
        {!pickedCoords && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md border border-border pointer-events-none">
            <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-[#008A4B]" />
              Search an address or click on the map to pin location
            </p>
          </div>
        )}

        {/* Coordinate display */}
        {pickedCoords && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#008A4B] text-white px-4 py-2 rounded-full shadow-md pointer-events-none">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {pickedCoords.lat.toFixed(5)}, {pickedCoords.lng.toFixed(5)} · Drag pin to adjust
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
