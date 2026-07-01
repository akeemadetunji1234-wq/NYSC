"use client";

import { useState, useEffect } from "react";
import { Navigation, Compass, MapPin, Save, Loader2, Footprints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateMemberProfile } from "@/app/actions/member";
import dynamic from "next/dynamic";

const CommuteMap = dynamic(() => import("../CommuteMap"), { ssr: false });

// Predefined LGA Coordinates for estimation based on popular states
const LGA_COORDINATES: Record<string, Array<{ name: string; lat: number; lng: number }>> = {
  Lagos: [
    { name: "Ikeja (LGA Secretariat)", lat: 6.6018, lng: 3.3515 },
    { name: "Surulere (LGA Secretariat)", lat: 6.4984, lng: 3.3581 },
    { name: "Yaba (Yaba Tech/Unilag)", lat: 6.5181, lng: 3.3858 },
    { name: "Eti-Osa (Ikoyi/Lekki)", lat: 6.4483, lng: 3.4883 },
    { name: "Apapa (Secretariat)", lat: 6.4381, lng: 3.3649 },
  ],
  Abuja: [
    { name: "AMAC (Municipal Secretariat)", lat: 9.0765, lng: 7.3986 },
    { name: "Gwagwalada (Secretariat)", lat: 8.9482, lng: 7.0784 },
    { name: "Bwari (Secretariat)", lat: 9.2882, lng: 7.3831 },
    { name: "Kuje (Secretariat)", lat: 8.8781, lng: 7.2284 },
  ],
  Oyo: [
    { name: "Ibadan North (Bodija)", lat: 7.4181, lng: 3.9122 },
    { name: "Ibadan Southwest (Ring Road)", lat: 7.3682, lng: 3.8649 },
    { name: "Ogbomosho North", lat: 8.1381, lng: 4.2483 },
  ],
  Rivers: [
    { name: "Port Harcourt City (Secretariat)", lat: 4.7784, lng: 7.0084 },
    { name: "Obio-Akpor", lat: 4.8483, lng: 6.9881 },
  ],
};

interface CommuteEstimatorProps {
  propertyLat: number | null;
  propertyLng: number | null;
  propertyState: string;
  userId?: string | null;
  initialPpa?: {
    ppaState?: string | null;
    ppaLga?: string | null;
    ppaLatitude?: number | null;
    ppaLongitude?: number | null;
  } | null;
}

export function CommuteEstimator({
  propertyLat,
  propertyLng,
  propertyState,
  userId,
  initialPpa,
}: CommuteEstimatorProps) {
  const [ppaState, setPpaState] = useState(initialPpa?.ppaState || propertyState);
  const [selectedLga, setSelectedLga] = useState<string>("");
  const [customLat, setCustomLat] = useState<string>("");
  const [customLng, setCustomLng] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [activePpaLat, setActivePpaLat] = useState<number | null>(null);
  const [activePpaLng, setActivePpaLng] = useState<number | null>(null);

  // Set initial PPA if exists
  useEffect(() => {
    if (initialPpa?.ppaLatitude && initialPpa?.ppaLongitude) {
      const lat = initialPpa.ppaLatitude;
      const lng = initialPpa.ppaLongitude;
      setCustomLat(lat.toString());
      setCustomLng(lng.toString());
      setIsCustom(true);
      calculateCommute(lat, lng);
    } else {
      // Pick first default LGA for this state if available
      const defaults = LGA_COORDINATES[propertyState] || [];
      if (defaults.length > 0) {
        setSelectedLga(defaults[0].name);
        calculateCommute(defaults[0].lat, defaults[0].lng);
      }
    }
  }, [initialPpa, propertyLat, propertyLng]);

  // Haversine formula to compute distance
  const calculateCommute = (ppaLat: number, ppaLng: number) => {
    if (!propertyLat || !propertyLng) return;

    const R = 6371; // Earth radius in km
    const dLat = (ppaLat - propertyLat) * (Math.PI / 180);
    const dLon = (ppaLng - propertyLng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(propertyLat * (Math.PI / 180)) *
        Math.cos(ppaLat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c; // Distance in km

    setDistance(Number(dist.toFixed(1)));
    setActivePpaLat(ppaLat);
    setActivePpaLng(ppaLng);
    
    // Average city travel time (assuming 25 km/h standard traffic)
    const timeMinutes = Math.round((dist / 25) * 60);
    setDuration(timeMinutes < 1 ? 1 : timeMinutes);
  };

  const handleLgaChange = (lgaName: string) => {
    setSelectedLga(lgaName);
    const selected = LGA_COORDINATES[ppaState]?.find((l) => l.name === lgaName);
    if (selected) {
      calculateCommute(selected.lat, selected.lng);
    }
  };

  const handleCustomCalculate = () => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Please enter valid decimal coordinates");
      return;
    }
    calculateCommute(lat, lng);
  };

  const handleSaveToProfile = async () => {
    if (!userId) {
      toast.error("Please sign in to save your PPA profile");
      return;
    }
    
    let lat = 0;
    let lng = 0;
    let lgaName = selectedLga;

    if (isCustom) {
      lat = parseFloat(customLat);
      lng = parseFloat(customLng);
      lgaName = "Custom Coordinates";
    } else {
      const selected = LGA_COORDINATES[ppaState]?.find((l) => l.name === selectedLga);
      if (selected) {
        lat = selected.lat;
        lng = selected.lng;
      }
    }

    if (!lat || !lng) {
      toast.error("No valid PPA location selected");
      return;
    }

    setIsSaving(true);
    try {
      await updateMemberProfile(userId, {
        ppaState: ppaState,
        ppaLga: lgaName.split(" ")[0],
        ppaLatitude: lat,
        ppaLongitude: lng,
      });
      toast.success("PPA Location saved to your profile!");
    } catch (err) {
      toast.error("Failed to save PPA settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Cost estimates based on standard local rates in Nigeria
  const estimateFare = (type: "bike" | "keke" | "bus") => {
    if (distance === null) return 0;
    
    switch (type) {
      case "bike":
        // Bike base ₦200 + ₦150 per km
        return Math.round(200 + distance * 150);
      case "keke":
        // Keke base ₦150 + ₦100 per km
        return Math.round(150 + distance * 100);
      case "bus":
        // Bus base ₦100 + ₦80 per km
        return Math.round(100 + distance * 80);
      default:
        return 0;
    }
  };

  // Get list of LGAs for active state (fallback to generic if not defined)
  const availableLgas = LGA_COORDINATES[ppaState] || [
    { name: "LGA Secretariat (Central)", lat: (propertyLat || 6.5) + 0.05, lng: (propertyLng || 3.3) + 0.05 },
    { name: "LGA Health Centre", lat: (propertyLat || 6.5) - 0.03, lng: (propertyLng || 3.3) - 0.04 },
  ];

  // Auto initialize fallback LGA coordinate arrays if not mapped
  useEffect(() => {
    if (!LGA_COORDINATES[ppaState] && propertyLat && propertyLng) {
      LGA_COORDINATES[ppaState] = [
        { name: "LGA Secretariat (Central)", lat: propertyLat + 0.04, lng: propertyLng + 0.03 },
        { name: "PPA Zone A", lat: propertyLat - 0.02, lng: propertyLng + 0.02 },
        { name: "PPA Zone B (Town Square)", lat: propertyLat + 0.01, lng: propertyLng - 0.03 },
      ];
      setSelectedLga(LGA_COORDINATES[ppaState][0].name);
      calculateCommute(LGA_COORDINATES[ppaState][0].lat, LGA_COORDINATES[ppaState][0].lng);
    }
  }, [ppaState, propertyLat, propertyLng]);

  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-green-50 dark:bg-green-950/30 rounded-xl">
          <Navigation className="w-5 h-5 text-[#008A4B]" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">PPA Commute & Cost Estimator</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Calculate your daily transport budget from this lodge.</p>
        </div>
      </div>

      {/* Target selector */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-1">
          <button
            onClick={() => setIsCustom(false)}
            className={`pb-2 px-1 text-xs font-semibold border-b-2 transition ${
              !isCustom ? "border-b-[#008A4B] text-[#008A4B]" : "border-b-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            LGA Secretariats
          </button>
          <button
            onClick={() => setIsCustom(true)}
            className={`pb-2 px-1 text-xs font-semibold border-b-2 transition ${
              isCustom ? "border-b-[#008A4B] text-[#008A4B]" : "border-b-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Custom PPA Coordinates
          </button>
        </div>

        {!isCustom ? (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground">Select Local Destination</label>
            <select
              value={selectedLga}
              onChange={(e) => handleLgaChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20"
            >
              {availableLgas.map((lga) => (
                <option key={lga.name} value={lga.name}>
                  {lga.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Latitude</label>
              <input
                type="text"
                placeholder="e.g. 6.5244"
                value={customLat}
                onChange={(e) => setCustomLat(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Longitude</label>
              <input
                type="text"
                placeholder="e.g. 3.3792"
                value={customLng}
                onChange={(e) => setCustomLng(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCustomCalculate}
              className="col-span-2 text-xs h-9 rounded-xl flex items-center justify-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5" /> Calculate Custom Route
            </Button>
          </div>
        )}
      </div>

      {/* Calculations details */}
      {distance !== null && duration !== null ? (
        <div className="space-y-4">
          {propertyLat && propertyLng && activePpaLat && activePpaLng && (
            <CommuteMap 
              propertyCoords={{ lat: propertyLat, lng: propertyLng }} 
              ppaCoords={{ lat: activePpaLat, lng: activePpaLng }} 
            />
          )}
          <div className="p-4 bg-secondary rounded-2xl flex items-center justify-between border border-border">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span className="text-sm font-medium text-foreground">Estimated Distance</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">{distance} km</p>
              <p className="text-xs text-muted-foreground">~{duration} mins travel time</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Daily Commute Estimates</h4>

            {/* Okada */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-secondary/40 transition">
              <div className="flex items-center gap-3">
                <span className="text-xl">🏍️</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">Okada (Motorbike)</p>
                  <p className="text-[10px] text-muted-foreground">Fastest through local traffic</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">₦{estimateFare("bike").toLocaleString()}</p>
                <p className="text-[10px] text-emerald-600 font-medium">~{Math.round(duration * 0.7)} mins</p>
              </div>
            </div>

            {/* Keke */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-secondary/40 transition">
              <div className="flex items-center gap-3">
                <span className="text-xl">🛺</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">Keke Marwa (Tricycle)</p>
                  <p className="text-[10px] text-muted-foreground">Shared regional transit</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">₦{estimateFare("keke").toLocaleString()}</p>
                <p className="text-[10px] text-amber-600 font-medium">~{duration} mins</p>
              </div>
            </div>

            {/* Danfo */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-secondary/40 transition">
              <div className="flex items-center gap-3">
                <span className="text-xl">🚌</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">Danfo (Local Bus)</p>
                  <p className="text-[10px] text-muted-foreground">Cheapest option, fixed route</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">₦{estimateFare("bus").toLocaleString()}</p>
                <p className="text-[10px] text-amber-600 font-medium">~{Math.round(duration * 1.3)} mins</p>
              </div>
            </div>
          </div>

          {userId && (
            <Button
              onClick={handleSaveToProfile}
              disabled={isSaving}
              className="w-full bg-[#008A4B] hover:bg-[#006F3C] text-white rounded-xl shadow-sm flex items-center justify-center gap-2 text-xs py-2.5 h-10 mt-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save PPA Settings to Profile
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground border border-dashed border-border rounded-xl">
          <Footprints className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-xs">Property location not defined. Cannot compute commute details.</p>
        </div>
      )}
    </div>
  );
}
