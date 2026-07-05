"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

interface CommuteMapProps {
  propertyCoords: { lat: number; lng: number };
  ppaCoords: { lat: number; lng: number };
}

// Adjust viewport to contain both markers
function MapAutoFit({ bounds }: { bounds: [[number, number], [number, number]] }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]);
  return null;
}

export default function CommuteMap({ propertyCoords, ppaCoords }: CommuteMapProps) {
  const [isSatellite, setIsSatellite] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);

  const bounds: [[number, number], [number, number]] = [
    [propertyCoords.lat, propertyCoords.lng],
    [ppaCoords.lat, ppaCoords.lng],
  ];

  // Fetch actual street route from OSRM public API
  useEffect(() => {
    async function fetchRoute() {
      setIsLoadingRoute(true);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${ppaCoords.lng},${ppaCoords.lat};${propertyCoords.lng},${propertyCoords.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const geojson = data.routes[0].geometry;
          const coords = geojson.coordinates.map((c: any) => [c[1], c[0]] as [number, number]);
          setRouteCoords(coords);
        } else {
          // Fallback to straight line
          setRouteCoords([[ppaCoords.lat, ppaCoords.lng], [propertyCoords.lat, propertyCoords.lng]]);
        }
      } catch (err) {
        console.error("OSRM Routing failed, using straight-line fallback:", err);
        setRouteCoords([[ppaCoords.lat, ppaCoords.lng], [propertyCoords.lat, propertyCoords.lng]]);
      } finally {
        setIsLoadingRoute(false);
      }
    }
    fetchRoute();
  }, [propertyCoords, ppaCoords]);

  // Split route coordinates to simulate traffic segments
  const firstHalf = routeCoords.slice(0, Math.floor(routeCoords.length / 2) + 1);
  const secondHalf = routeCoords.slice(Math.floor(routeCoords.length / 2));

  return (
    <div className="relative h-[280px] w-full rounded-2xl overflow-hidden border border-border shadow-inner z-0">
      {/* Map Control Overlays */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 bg-card/90 backdrop-blur p-2.5 rounded-xl border border-border shadow-md">
        <button
          type="button"
          onClick={() => setIsSatellite(!isSatellite)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            isSatellite
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-secondary text-foreground hover:bg-secondary/80"
          }`}
        >
          🛰️ {isSatellite ? "Satellite Map" : "Standard Map"}
        </button>
        <button
          type="button"
          onClick={() => setShowTraffic(!showTraffic)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            showTraffic
              ? "bg-rose-600 text-white shadow-sm"
              : "bg-secondary text-foreground hover:bg-secondary/80"
          }`}
        >
          🚦 {showTraffic ? "Traffic Overlay ON" : "Traffic Overlay OFF"}
        </button>
      </div>

      <MapContainer
        bounds={bounds}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        {isSatellite ? (
          <TileLayer
            attribution='Map data &copy; <a href="https://www.esri.com/">Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}
        
        {/* Property Pin */}
        <Marker position={propertyCoords}>
          <Popup>
            <div className="text-xs font-semibold text-foreground">Property Location</div>
          </Popup>
        </Marker>

        {/* PPA Pin */}
        <Marker position={ppaCoords}>
          <Popup>
            <div className="text-xs font-semibold text-[#008A4B]">Your PPA Secretariat</div>
          </Popup>
        </Marker>

        {/* Dynamic Route Line */}
        {!isLoadingRoute && routeCoords.length > 0 && (
          showTraffic ? (
            <>
              {/* Traffic Congested Segment (Red) */}
              <Polyline
                positions={firstHalf}
                pathOptions={{
                  color: "#EF4444", // Red
                  weight: 5,
                  opacity: 0.9
                }}
              />
              {/* Free Flowing Segment (Green) */}
              <Polyline
                positions={secondHalf}
                pathOptions={{
                  color: "#10B981", // Green
                  weight: 5,
                  opacity: 0.9
                }}
              />
            </>
          ) : (
            <Polyline
              positions={routeCoords}
              pathOptions={{
                color: "#2563EB", // Blue path for route
                weight: 4,
                opacity: 0.85
              }}
            />
          )
        )}

        <MapAutoFit bounds={bounds} />
      </MapContainer>
    </div>
  );
}
