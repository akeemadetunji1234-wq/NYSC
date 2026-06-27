"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import Link from "next/link";
import L from "leaflet";

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

// Nigeria center
const nigeriaCenter: [number, number] = [9.082, 8.6753];

// Green property marker
const propertyIcon = new L.DivIcon({
  className: "",
  html: `<div style="background:#008A4B;color:white;font-size:11px;font-weight:700;padding:4px 8px;border-radius:20px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;">📍</div>`,
  iconAnchor: [20, 20],
});

// PPA marker
const ppaIcon = new L.DivIcon({
  className: "",
  html: `<div style="background:#1e40af;color:white;font-size:10px;font-weight:700;padding:4px 10px;border-radius:20px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;">🎯 My PPA</div>`,
  iconAnchor: [30, 20],
});

export default function PropertyMap({ properties, userPpa }: PropertyMapProps) {
  const mappableProperties = properties.filter(p => p.latitude && p.longitude);

  const center: [number, number] = userPpa
    ? [userPpa.lat, userPpa.lng]
    : mappableProperties.length > 0 && mappableProperties[0].latitude && mappableProperties[0].longitude
    ? [mappableProperties[0].latitude!, mappableProperties[0].longitude!]
    : nigeriaCenter;

  return (
    <MapContainer
      center={center}
      zoom={userPpa ? 11 : 6}
      scrollWheelZoom={true}
      className="h-full w-full z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* PPA Marker */}
      {userPpa && (
        <Marker position={[userPpa.lat, userPpa.lng]} icon={ppaIcon}>
          <Popup>
            <div className="text-sm">
              <p className="font-bold text-blue-700">Your PPA</p>
              <p className="text-slate-500">{userPpa.area}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Property Markers */}
      {mappableProperties.map(p => (
        <Marker key={p.id} position={[p.latitude!, p.longitude!]} icon={propertyIcon}>
          <Popup maxWidth={220}>
            <div className="space-y-1 py-1">
              <img src={p.image} alt={p.name} className="w-full h-24 object-cover rounded-lg mb-2" />
              <p className="font-bold text-slate-900 text-sm leading-tight">{p.name}</p>
              <p className="text-xs text-slate-500">{p.location}</p>
              {p.distanceKm !== null && (
                <p className="text-xs font-semibold text-[#008A4B]">
                  {p.distanceKm} km · ~{p.distanceMins} min from PPA
                </p>
              )}
              <p className="font-bold text-[#008A4B]">{p.price}<span className="text-slate-400 font-normal">/yr</span></p>
              <a
                href={`/member/listing/${p.id}`}
                className="block mt-2 text-center bg-[#008A4B] text-white text-xs font-bold py-1.5 rounded-lg hover:bg-[#006F3C] transition"
              >
                View Property
              </a>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Empty state message if no pinned properties */}
      {mappableProperties.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-xl border border-slate-100 text-center">
            <p className="font-bold text-slate-700">No properties with map pins yet</p>
            <p className="text-xs text-slate-400 mt-1">Agents need to pin their properties on the map</p>
          </div>
        </div>
      )}
    </MapContainer>
  );
}
