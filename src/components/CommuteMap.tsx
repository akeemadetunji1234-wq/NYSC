"use client";

import { useEffect } from "react";
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
  const bounds: [[number, number], [number, number]] = [
    [propertyCoords.lat, propertyCoords.lng],
    [ppaCoords.lat, ppaCoords.lng],
  ];

  return (
    <div className="h-[220px] w-full rounded-2xl overflow-hidden border border-border shadow-inner relative z-0">
      <MapContainer
        bounds={bounds}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
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

        {/* Route Line overlay */}
        <Polyline
          positions={[
            [propertyCoords.lat, propertyCoords.lng],
            [ppaCoords.lat, ppaCoords.lng],
          ]}
          pathOptions={{
            color: "#008A4B",
            weight: 4,
            dashArray: "6, 8",
            opacity: 0.85
          }}
        />

        <MapAutoFit bounds={bounds} />
      </MapContainer>
    </div>
  );
}
