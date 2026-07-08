"use client";

import { PageTransition } from "../../components/layout/PageTransition";
import { Search, MapPin, SlidersHorizontal, Map, Star, X, ChevronDown, Navigation, Clock, Crown, Bell, Wifi, Wrench } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { getPublishedProperties } from "../actions/property";
import { getUserProfile } from "../actions/member";
import { SavePropertyButton } from "../../features/member/SavePropertyButton";
import { useSession } from "next-auth/react";
import { calculateDistance, calculateTime } from "../../lib/distance";
import dynamic from "next/dynamic";
import { useLowData } from "../../contexts/LowDataContext";

const PropertyMap = dynamic(() => import("../../components/PropertyMap"), { ssr: false });

const NIGERIAN_STATES = [
  "All States","Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara"
];

const PRICE_RANGES = [
  { label: "Any Price", value: "all" },
  { label: "Under ₦100k", value: "under100k" },
  { label: "₦100k – ₦200k", value: "100k-200k" },
  { label: "₦200k – ₦400k", value: "200k-400k" },
  { label: "Over ₦400k", value: "over400k" },
];

export default function MemberExplorePage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('All States');
  const [searchQuery, setSearchQuery] = useState('');
  const [nearPpa, setNearPpa] = useState(false);
  const [maxPpaKm, setMaxPpaKm] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [compareList, setCompareList] = useState<any[]>([]);
  const { lowDataMode } = useLowData();

  const toggleCompare = (lodge: any) => {
    setCompareList(prev => {
      const exists = prev.find(p => p.id === lodge.id);
      if (exists) {
        return prev.filter(p => p.id !== lodge.id);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, lodge];
    });
  };

  const [rawProperties, setRawProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPpa, setUserPpa] = useState<{ lat: number; lng: number; area: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getPublishedProperties(userId);
        const profile = userId ? await getUserProfile(userId) : null;
        setRawProperties(data);
        if (profile?.ppaLatitude && profile?.ppaLongitude) {
          setUserPpa({ lat: profile.ppaLatitude, lng: profile.ppaLongitude, area: `${profile.ppaLga}, ${profile.ppaState}` });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId]);

  const lodges = useMemo(() => {
    return rawProperties.map(p => {
      let distanceKm: number | null = null;
      let distanceMins: number | null = null;
      if (userPpa && p.latitude && p.longitude) {
        distanceKm = calculateDistance(userPpa.lat, userPpa.lng, p.latitude, p.longitude);
        distanceMins = calculateTime(distanceKm);
      }
      return {
        id: p.id,
        name: p.title,
        location: p.location,
        state: p.state,
        lga: p.lga,
        priceRaw: p.price,
        price: `₦${p.price.toLocaleString()}`,
        rating: 4.8,
        reviews: 0,
        image: p.images[0] || "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600",
        type: `${p.bedrooms} Bedroom`,
        tags: p.amenities.slice(0, 3),
        isSaved: p.isSaved,
        latitude: p.latitude,
        longitude: p.longitude,
        distanceKm,
        distanceMins,
      };
    });
  }, [rawProperties, userPpa]);

  const filteredLodges = useMemo(() => {
    return lodges.filter(lodge => {
      if (searchQuery && !lodge.name.toLowerCase().includes(searchQuery.toLowerCase()) && !lodge.location.toLowerCase().includes(searchQuery.toLowerCase()) && !lodge.lga?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedState !== 'All States' && lodge.state?.toLowerCase() !== selectedState.toLowerCase()) {
        return false;
      }
      if (priceRange !== 'all') {
        const p = lodge.priceRaw;
        if (priceRange === 'under100k' && p >= 100000) return false;
        if (priceRange === '100k-200k' && (p < 100000 || p > 200000)) return false;
        if (priceRange === '200k-400k' && (p < 200000 || p > 400000)) return false;
        if (priceRange === 'over400k' && p <= 400000) return false;
      }
      if (nearPpa) {
        if (!userPpa) return false;
        if (lodge.distanceKm === null || lodge.distanceKm > maxPpaKm) return false;
      }
      return true;
    });
  }, [lodges, searchQuery, selectedState, priceRange, nearPpa, maxPpaKm, userPpa]);

  const activeFilterCount = [
    selectedState !== 'All States',
    priceRange !== 'all',
    nearPpa,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedState('All States');
    setPriceRange('all');
    setSearchQuery('');
    setNearPpa(false);
    setMaxPpaKm(10);
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

        {/* Search Header */}
        <div className="bg-[#008A4B] rounded-3xl p-8 text-white shadow-lg text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Map className="w-48 h-48" />
          </div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Find your perfect lodge.</h1>
            <p className="text-green-100 mb-6 text-sm">Discover safe, affordable housing near your PPA.</p>
            <div className="bg-card p-2 rounded-2xl flex flex-col md:flex-row gap-2 shadow-xl">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, area, location..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-secondary border-none focus:ring-0 text-foreground text-sm"
                />
              </div>
              <div className="w-px bg-slate-200 hidden md:block my-2"></div>
              <div className="flex-1 relative">
                <MapPin className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-secondary border-none focus:ring-0 text-foreground text-sm appearance-none"
                >
                  {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <Button className="bg-[#008A4B] hover:bg-[#006F3C] text-white py-3 px-8 rounded-xl h-auto">
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Premium Quick Actions (Only shows for Premium Users) */}
        {(session?.user as any)?.isPremium && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: "/member/notifications", label: "New Listing Alerts", icon: Bell, color: "text-blue-600 bg-blue-50" },
              { href: "/member/offline", label: "Offline Mode", icon: Wifi, color: "text-purple-600 bg-purple-50" },
              { href: "/member/transport", label: "Transport Guides", icon: MapPin, color: "text-amber-600 bg-amber-50" },
              { href: "/member/artisans", label: "Artisan Directory", icon: Wrench, color: "text-emerald-600 bg-emerald-50" },
            ].map((feat, i) => (
              <Link key={i} href={feat.href} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-card border border-[#008A4B]/20 shadow-sm hover:shadow-md hover:border-[#008A4B] transition-all group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feat.color} group-hover:scale-110 transition-transform`}>
                  <feat.icon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-xs text-foreground text-center">{feat.label}</p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-1">
                  <Crown className="w-2.5 h-2.5" /> Premium
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition ${showFilters || activeFilterCount > 0 ? 'bg-[#008A4B] text-white border-[#008A4B]' : 'bg-card text-muted-foreground border-border hover:bg-secondary'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-card text-[#008A4B] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Price Range Quick Filter */}
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="px-4 py-2 text-sm font-medium rounded-full border border-border bg-card hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20 text-muted-foreground"
            >
              {PRICE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>

            {/* Near PPA Toggle */}
            {userPpa && (
              <button
                onClick={() => setNearPpa(!nearPpa)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition ${nearPpa ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-card text-muted-foreground border-border hover:bg-secondary'}`}
              >
                <Navigation className="w-4 h-4" />
                Near my PPA
              </button>
            )}

            {/* Active Filters Pills */}
            {selectedState !== 'All States' && (
              <span className="flex items-center gap-1 bg-secondary text-muted-foreground px-3 py-1.5 rounded-full text-xs font-medium">
                {selectedState}
                <button onClick={() => setSelectedState('All States')}><X className="w-3 h-3 ml-1" /></button>
              </span>
            )}
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-red-500 font-medium underline transition">
                Clear all
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="bg-card p-1 rounded-full border border-border flex shrink-0">
            <Button
              variant="ghost"
              onClick={() => setViewMode('list')}
              className={`rounded-full px-5 h-8 text-xs font-bold ${viewMode === 'list' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}
            >
              List
            </Button>
            <Button
              variant="ghost"
              onClick={() => setViewMode('map')}
              className={`rounded-full px-5 h-8 text-xs font-bold ${viewMode === 'map' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}
            >
              <Map className="w-3 h-3 mr-1" /> Map
            </Button>
          </div>
        </div>

        {/* Expanded Filter Panel */}
        {showFilters && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* State */}
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">State</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20 focus:border-[#008A4B]"
              >
                {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">Price Range</label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20 focus:border-[#008A4B]"
              >
                {PRICE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            {/* Near PPA Radius */}
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">
                Distance from PPA
                {!userPpa && <span className="text-xs text-slate-400 font-normal ml-2">(Set PPA in your profile)</span>}
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={maxPpaKm}
                  onChange={(e) => setMaxPpaKm(Number(e.target.value))}
                  disabled={!userPpa}
                  className="w-full accent-[#008A4B] disabled:opacity-40"
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Within {maxPpaKm} km</span>
                  <button
                    onClick={() => setNearPpa(!nearPpa)}
                    disabled={!userPpa}
                    className={`text-xs font-semibold px-3 py-1 rounded-full transition ${nearPpa && userPpa ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary text-muted-foreground'} disabled:opacity-40`}
                  >
                    {nearPpa ? 'Active' : 'Apply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading...' : `Showing ${filteredLodges.length} ${filteredLodges.length === 1 ? 'property' : 'properties'}`}
            {nearPpa && userPpa && <span className="text-[#008A4B] font-medium"> near your PPA in {userPpa.area}</span>}
          </p>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-[#008A4B] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground text-sm">Loading properties...</p>
          </div>
        ) : filteredLodges.length === 0 ? (
          <div className="bg-card rounded-3xl border border-border py-20 px-4 text-center flex flex-col items-center shadow-sm">
            <div className="bg-secondary w-24 h-24 rounded-full flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No lodges found</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">No properties match your current filters. Try adjusting your search or clearing filters.</p>
            <Button onClick={clearFilters} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
              Clear Filters
            </Button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredLodges.map((lodge) => (
              <div key={lodge.id} className="bg-card/95 backdrop-blur-sm rounded-2xl border border-border/50 shadow-sm overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:border-[#008A4B]/30 duration-300 ease-out flex flex-col">
                <div className="relative h-56 w-full overflow-hidden bg-secondary">
                  <Link href={`/member/listing/${lodge.id}`} className="absolute inset-0 z-0">
                    {!lowDataMode ? (
                      <Image src={lodge.image} alt={lodge.name} width={400} height={300} className="w-full h-full object-cover group-hover:scale-105 duration-500 ease-out" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900">
                        <MapPin className="w-6 h-6 text-muted-foreground mb-1" />
                        <span className="text-[10px] font-bold text-muted-foreground">Low Data Mode</span>
                      </div>
                    )}
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleCompare(lodge);
                    }}
                    title="Compare property"
                    className={`absolute top-2 left-2 z-10 p-2 rounded-full backdrop-blur-sm border shadow-sm transition-all cursor-pointer ${
                      compareList.find(p => p.id === lodge.id)
                        ? 'bg-amber-500 border-amber-600 text-white'
                        : 'bg-black/40 text-white border-transparent hover:bg-black/60'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <SavePropertyButton propertyId={lodge.id} userId={userId || "mock-corp-id"} initiallySaved={lodge.isSaved} iconOnly={true} />
                  {/* State badge */}
                  {lodge.state && (
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {lodge.state}
                    </div>
                  )}
                </div>
                <Link href={`/member/listing/${lodge.id}`} className="block flex-1 flex flex-col">
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-foreground line-clamp-1 text-sm">{lodge.name}</h3>
                        <p className="flex items-center gap-1 text-xs font-bold text-foreground shrink-0 ml-1">
                          <Star className="w-3 h-3 text-amber-400 fill-current" /> {lodge.rating}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3 shrink-0" /> {lodge.location}
                      </p>
                      {/* Distance from PPA badge on card */}
                      {lodge.distanceKm !== null && (
                        <div className="flex items-center gap-1 mb-2">
                          <Navigation className="w-3 h-3 text-[#008A4B]" />
                          <span className="text-[11px] font-semibold text-[#008A4B]">{lodge.distanceKm} km</span>
                          <Clock className="w-3 h-3 text-slate-400 ml-1" />
                          <span className="text-[11px] text-muted-foreground">~{lodge.distanceMins} min</span>
                          <span className="text-[10px] text-slate-400">from PPA</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {lodge.tags.map((tag: string, idx: number) => (
                          <span key={idx} className="bg-green-50/80 dark:bg-green-950/30 text-[#008A4B] dark:text-green-300 border border-green-100/50 dark:border-green-900/30 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 backdrop-blur-sm">
                            <span className="w-1 h-1 bg-[#008A4B] rounded-full"></span>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-border/50 pt-3 flex items-center justify-between mt-2">
                      <p className="font-bold text-[#008A4B] text-sm sm:text-base">{lodge.price}<span className="text-xs text-muted-foreground font-normal">/yr</span></p>
                      <Button size="sm" className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white rounded-lg h-8 px-4 text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-300" asChild>
                        <span>View Details</span>
                      </Button>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl overflow-hidden border border-border shadow-inner h-[600px]">
            <PropertyMap properties={filteredLodges} userPpa={userPpa} />
          </div>
        )}

        {/* Sticky Compare Bottom Drawer */}
        {compareList.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border shadow-xl rounded-2xl px-6 py-4 flex items-center justify-between gap-6 max-w-lg w-[calc(100%-2rem)] animate-in slide-in-from-bottom-6 duration-300">
            <div className="flex-1">
              <p className="font-bold text-sm text-foreground">Compare Lodges ({compareList.length}/4)</p>
              <p className="text-xs text-muted-foreground mt-0.5">Select up to 4 to compare features side-by-side.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setCompareList([])} className="text-xs text-muted-foreground hover:text-slate-900 font-semibold cursor-pointer">
                Clear
              </button>
              <Link href={{ pathname: "/member/compare", query: { ids: compareList.map(p => p.id).join(",") } }}>
                <Button className="bg-[#008A4B] hover:bg-[#006F3C] text-white text-xs rounded-xl font-bold h-9 px-4 cursor-pointer">
                  Compare Now
                </Button>
              </Link>
            </div>
          </div>
        )}

      </div>
    </PageTransition>
  );
}
