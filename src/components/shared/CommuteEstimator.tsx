"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Navigation, Compass, MapPin, Save, Loader2, Footprints, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateMemberProfile } from "@/app/actions/member";
import dynamic from "next/dynamic";

const CommuteMap = dynamic(() => import("../CommuteMap"), { ssr: false });

const NYSC_CAMPS: Record<string, { name: string; lat: number; lng: number; tips: string }> = {
  Benue: {
    name: "NYSC Permanent Orientation Camp, Wannune (Tarka LGA)",
    lat: 7.4358,
    lng: 8.8872,
    tips: "Okada (motorbikes) are the primary transit mode inside Wannune and Gboko. Keke Marwa (tricycles) operate mainly on the main Gboko-Makurdi highway."
  },
  Lagos: {
    name: "NYSC Permanent Orientation Camp, Iyana-Ipaja (Agege)",
    lat: 6.6190,
    lng: 3.2872,
    tips: "BRT buses are the cheapest way to navigate main highways in Lagos. Keke and Okada are banned on major expressways but operate widely in residential estates."
  },
  Abuja: {
    name: "NYSC Permanent Orientation Camp, Kubwa (Bwari)",
    lat: 9.1554,
    lng: 7.3371,
    tips: "Shared green cabs and coasters are popular routes from Kubwa Camp to AMAC/Wuse. Uber/Bolt operate widely inside the city center."
  },
  Oyo: {
    name: "NYSC Permanent Orientation Camp, Iseyin",
    lat: 7.9734,
    lng: 3.5938,
    tips: "Micra (shared cabs) are the cheapest transit in Ibadan. Bike options like local Okada operate widely in Iseyin and Oyo town."
  },
  Rivers: {
    name: "NYSC Permanent Orientation Camp, Nonwa Gbam (Tai LGA)",
    lat: 4.7431,
    lng: 7.2721,
    tips: "Coaster buses operate regular routes from Tai camp to Port Harcourt city. Local Keke runs inside Nonwa town."
  },
};

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
  const [activeTab, setActiveTab] = useState<'lga' | 'camp' | 'custom'>('lga');
  const [isSaving, setIsSaving] = useState(false);

  // Address search state
  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<{display_name: string; lat: string; lon: string}[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

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
      setActiveTab('custom');
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

  const handleCampTabClick = () => {
    setActiveTab('camp');
    const camp = NYSC_CAMPS[propertyState] || NYSC_CAMPS["Lagos"];
    if (camp) {
      calculateCommute(camp.lat, camp.lng);
    }
  };

  const handleCustomCalculate = () => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Please search and select a location first");
      return;
    }
    calculateCommute(lat, lng);
  };

  // Geocode using Nominatim (OpenStreetMap) — free, no key needed
  const handleAddressSearch = useCallback(async (query: string) => {
    if (query.length < 3) { setAddressSuggestions([]); return; }
    setIsSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ng&limit=5&addressdetails=1`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data = await res.json();
      setAddressSuggestions(data || []);
    } catch {
      setAddressSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleAddressInputChange = (val: string) => {
    setAddressQuery(val);
    setSelectedAddress(null);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => handleAddressSearch(val), 450);
  };

  const handleSelectSuggestion = (suggestion: { display_name: string; lat: string; lon: string }) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    setCustomLat(lat.toString());
    setCustomLng(lng.toString());
    setSelectedAddress(suggestion.display_name);
    setAddressQuery(suggestion.display_name.split(",")[0]);
    setAddressSuggestions([]);
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

    if (activeTab === 'custom') {
      lat = parseFloat(customLat);
      lng = parseFloat(customLng);
      lgaName = "Custom Coordinates";
    } else if (activeTab === 'camp') {
      const camp = NYSC_CAMPS[propertyState];
      if (camp) {
        lat = camp.lat;
        lng = camp.lng;
        lgaName = "NYSC Camp";
      }
    } else {
      const selected = LGA_COORDINATES[ppaState]?.find((l) => l.name === selectedLga);
      if (selected) {
        lat = selected.lat;
        lng = selected.lng;
      }
    }

    if (!lat || !lng) {
      toast.error("No valid destination selected");
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
      toast.success("PPA/Camp Location saved to your profile!");
    } catch (err) {
      toast.error("Failed to save location settings");
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
          <h3 className="font-bold text-foreground">Commute & Cost Estimator</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Calculate travel distance and cost to this apartment.</p>
        </div>
      </div>

      {/* Target selector */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-border pb-1 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('lga');
              const defaults = LGA_COORDINATES[propertyState] || [];
              if (defaults.length > 0) {
                setSelectedLga(defaults[0].name);
                calculateCommute(defaults[0].lat, defaults[0].lng);
              }
            }}
            className={`pb-2 px-1 text-xs font-bold border-b-2 transition shrink-0 cursor-pointer ${
              activeTab === 'lga' ? "border-b-[#008A4B] text-[#008A4B]" : "border-b-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            LGA Secretariats
          </button>
          <button
            onClick={handleCampTabClick}
            className={`pb-2 px-1 text-xs font-bold border-b-2 transition shrink-0 cursor-pointer ${
              activeTab === 'camp' ? "border-b-[#008A4B] text-[#008A4B]" : "border-b-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            NYSC Orientation Camp
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-2 px-1 text-xs font-bold border-b-2 transition shrink-0 cursor-pointer ${
              activeTab === 'custom' ? "border-b-[#008A4B] text-[#008A4B]" : "border-b-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            My PPA / Address
          </button>
        </div>

        {activeTab === 'lga' && (
          <div className="flex flex-col gap-2 animate-in fade-in duration-200">
            <label className="text-xs font-medium text-muted-foreground">Select LGA Secretariat to calculate route to apartment</label>
            <select
              value={selectedLga}
              onChange={(e) => handleLgaChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20 cursor-pointer"
            >
              {availableLgas.map((lga) => (
                <option key={lga.name} value={lga.name}>
                  {lga.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'camp' && (
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950 rounded-2xl space-y-3 animate-in fade-in duration-200">
            <p className="text-xs font-bold text-[#008A4B] flex items-center gap-1.5">
              <span>📍</span> Camp Location:
            </p>
            <p className="text-xs font-semibold text-foreground">
              {NYSC_CAMPS[propertyState]?.name || `${propertyState} NYSC Permanent Orientation Camp`}
            </p>
            <div className="border-t border-emerald-100/50 dark:border-emerald-950/50 pt-2.5 space-y-1">
              <p className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">Local Commute Advice:</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {NYSC_CAMPS[propertyState]?.tips || "Transit lines run regularly between the camp and central areas."}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <label className="text-xs font-medium text-muted-foreground">Type your PPA address or location name</label>
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. Akinyele LGA Secretariat, Oyo"
                  value={addressQuery}
                  onChange={(e) => handleAddressInputChange(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20"
                />
                {isSearching && <Loader2 className="absolute right-3 w-4 h-4 animate-spin text-muted-foreground" />}
                {addressQuery && !isSearching && (
                  <button onClick={() => { setAddressQuery(""); setAddressSuggestions([]); setSelectedAddress(null); }} className="absolute right-3">
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {addressSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                  {addressSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectSuggestion(s)}
                      className="w-full text-left px-4 py-3 text-xs text-foreground hover:bg-secondary transition border-b border-border last:border-0"
                    >
                      <span className="font-semibold">{s.display_name.split(",")[0]}</span>
                      <span className="text-muted-foreground ml-1">{s.display_name.split(",").slice(1, 3).join(",")}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedAddress && (
              <div className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl">
                <MapPin className="w-4 h-4 text-[#008A4B] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#008A4B] font-medium leading-snug">{selectedAddress}</p>
              </div>
            )}

            {!selectedAddress && (
              <p className="text-[10px] text-muted-foreground">Start typing to see location suggestions in Nigeria. Select one to calculate the commute.</p>
            )}
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
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Estimated Distance</span>
                <span className="text-[10px] text-muted-foreground">
                  From {activeTab === 'lga' ? 'LGA Secretariat' : activeTab === 'camp' ? 'NYSC Camp' : 'Your PPA'} to Apartment
                </span>
              </div>
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
