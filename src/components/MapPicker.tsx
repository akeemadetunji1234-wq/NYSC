"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

interface MapPickerProps {
  initialPosition?: { lat: number; lng: number };
  onPositionChange: (pos: { lat: number; lng: number }) => void;
}

// Default center to Nigeria (Lagos roughly)
const defaultCenter = { lat: 6.5244, lng: 3.3792 };

function LocationMarker({ position, setPosition }: { position: {lat: number, lng: number} | null, setPosition: (p: {lat: number, lng: number}) => void }) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function MapPicker({ initialPosition, onPositionChange }: MapPickerProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(initialPosition || null);

  useEffect(() => {
    if (position) {
      onPositionChange(position);
    }
  }, [position, onPositionChange]);

  return (
    <div className="h-[300px] w-full rounded-md overflow-hidden border border-gray-300">
      <MapContainer
        center={initialPosition || defaultCenter}
        zoom={initialPosition ? 13 : 6}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>
    </div>
  );
}
