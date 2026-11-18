"use client";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Loader2, MapPin, Search } from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
const NIGERIA_BBOX: [number, number, number, number] = [2.6765, 4.2406, 14.6799, 13.8659];
const NIGERIA_CENTER: [number, number] = [8.6753, 9.082];
type PpaPosition = { lat: number; lng: number };
type AddressSuggestion = { id: string; label: string; lng: number; lat: number };
interface MapPickerProps { initialPosition?: PpaPosition; onPositionChange: (pos: PpaPosition) => void; area?: string; }

export default function MapPicker({ initialPosition, onPositionChange, area }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const searchRequestRef = useRef<AbortController | null>(null);
  const [pickedCoords, setPickedCoords] = useState<PpaPosition | null>(initialPosition || null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !MAPBOX_TOKEN) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: initialPosition ? [initialPosition.lng, initialPosition.lat] : NIGERIA_CENTER,
      zoom: initialPosition ? 13 : 6,
      maxBounds: [[NIGERIA_BBOX[0] - 0.5, NIGERIA_BBOX[1] - 0.5], [NIGERIA_BBOX[2] + 0.5, NIGERIA_BBOX[3] + 0.5]],
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    if (initialPosition) placeMarker(initialPosition.lng, initialPosition.lat, map);
    map.on("click", (event) => placeMarker(event.lngLat.lng, event.lngLat.lat, map));
    return () => {
      searchRequestRef.current?.abort();
      markerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 3) { setSuggestions([]); setSearchMessage(null); setIsSearching(false); return; }
    const timer = window.setTimeout(() => { void searchAddresses(value); }, 350);
    return () => window.clearTimeout(timer);
  }, [query, area]);

  async function searchAddresses(value: string) {
    searchRequestRef.current?.abort();
    const controller = new AbortController();
    searchRequestRef.current = controller;
    setIsSearching(true);
    setSearchMessage(null);
    try {
      const params = new URLSearchParams({ q: value });
      if (area?.trim()) params.set("area", area.trim());
      if (pickedCoords) params.set("proximity", `${pickedCoords.lng},${pickedCoords.lat}`);
      const response = await fetch(`/api/geocode?${params.toString()}`, { signal: controller.signal });
      const data = (await response.json()) as { results?: AddressSuggestion[]; error?: string };
      if (!response.ok && !data.results?.length) {
        setSuggestions([]);
        setSearchMessage(data.error || "Address search is temporarily unavailable. You can still click the map to pin your PPA.");
        return;
      }
      const nextSuggestions = (data.results || []).filter((result) => result.label && Number.isFinite(result.lat) && Number.isFinite(result.lng)).slice(0, 8);
      setSuggestions(nextSuggestions);
      if (!nextSuggestions.length) setSearchMessage("No match yet. Try the school, hospital, secretariat, or a nearby landmark, and make sure the state and LGA are selected.");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setSuggestions([]);
        setSearchMessage("Address search is temporarily unavailable. You can still click the map to pin your PPA.");
      }
    } finally {
      if (!controller.signal.aborted) setIsSearching(false);
    }
  }

  function selectSuggestion(feature: AddressSuggestion) {
    if (!mapRef.current) return;
    setQuery(feature.label);
    setSuggestions([]);
    setSearchMessage(null);
    placeMarker(feature.lng, feature.lat, mapRef.current);
  }

  function placeMarker(lng: number, lat: number, map: mapboxgl.Map) {
    if (!map || !map.getCanvasContainer()) return;
    markerRef.current?.remove();
    const el = document.createElement("div");
    el.className = "mapbox-custom-marker";
    el.style.cssText = "width:36px;height:36px;background:#008A4B;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 14px rgba(0,138,75,0.5);cursor:pointer;";
    const marker = new mapboxgl.Marker({ element: el, draggable: true }).setLngLat([lng, lat]).addTo(map);
    markerRef.current = marker;
    const newPos = { lat, lng };
    setPickedCoords(newPos);
    onPositionChange(newPos);
    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      const dragged = { lat: lngLat.lat, lng: lngLat.lng };
      setPickedCoords(dragged);
      onPositionChange(dragged);
    });
    map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 14) });
  }

  if (!MAPBOX_TOKEN) return (
    <div className="flex h-[320px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-amber-400 bg-amber-50">
      <MapPin className="h-8 w-8 text-amber-500" />
      <p className="text-sm font-semibold text-amber-700">Mapbox Token Missing</p>
      <p className="text-xs text-amber-600">Add NEXT_PUBLIC_MAPBOX_TOKEN to your environment.</p>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && suggestions[0]) { event.preventDefault(); selectSuggestion(suggestions[0]); } }} placeholder="Search PPA, school, secretariat, landmark, or address" className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-10 text-sm text-foreground shadow-sm outline-none transition focus:border-[#008A4B] focus:ring-2 focus:ring-[#008A4B]/20" aria-label="Search for your PPA address" />
        {isSearching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#008A4B]" />}
        {suggestions.length > 0 && <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          {suggestions.map((feature) => <button key={feature.id} type="button" onClick={() => selectSuggestion(feature)} className="flex w-full items-start gap-2 border-b border-border px-3 py-2.5 text-left last:border-0 hover:bg-secondary"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#008A4B]" /><span className="text-xs leading-5 text-foreground">{feature.label}</span></button>)}
        </div>}
      </div>
      {searchMessage && <p className="text-xs leading-5 text-amber-700">{searchMessage}</p>}
      <p className="text-xs text-muted-foreground">Select the state and LGA first, then search the school, hospital, secretariat, or street. If the exact gate is missing, click the map and drag the pin.</p>
      <div className="relative h-[320px] overflow-hidden rounded-xl border border-border shadow-md">
        <div ref={mapContainerRef} className="h-full w-full" />
        {!pickedCoords && <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border bg-white/90 px-4 py-2 shadow-md backdrop-blur-sm"><p className="flex items-center gap-1.5 text-xs font-semibold text-gray-600"><Search className="h-3.5 w-3.5 text-[#008A4B]" />Search an address or click on the map to pin your location</p></div>}
        {pickedCoords && <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-[#008A4B] px-4 py-2 text-white shadow-md"><p className="flex items-center gap-1.5 text-xs font-semibold"><MapPin className="h-3.5 w-3.5" />{pickedCoords.lat.toFixed(5)}, {pickedCoords.lng.toFixed(5)} · Drag pin to adjust</p></div>}
      </div>
    </div>
  );
}
