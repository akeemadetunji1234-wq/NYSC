"use client";

import { PageTransition } from "../../components/layout/PageTransition";
import { Search, MapPin, SlidersHorizontal, Map, Heart, Star } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getPublishedProperties } from "../actions/property";
import { SavePropertyButton } from "../../features/member/SavePropertyButton";
import { useSession } from "next-auth/react";

export default function MemberExplorePage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [lodges, setLodges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProperties() {
      try {
        const data = await getPublishedProperties(userId);
        const formatted = data.map(p => ({
          id: p.id,
          name: p.title,
          location: p.location,
          price: `₦${p.price.toLocaleString()}`,
          rating: 4.8, // Mock rating
          reviews: 0,
          image: p.images[0] || "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600",
          type: `${p.bedrooms} Bedroom`,
          tags: p.amenities.slice(0, 3),
          isSaved: p.isSaved
        }));
        setLodges(formatted);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadProperties();
  }, [userId]);

  const filteredLodges = lodges.filter(lodge => {
    // Basic search simulation
    if (searchQuery && !lodge.name.toLowerCase().includes(searchQuery.toLowerCase()) && !lodge.location.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Price filter
    if (priceRange === 'all') return true;
    const priceNum = parseInt(lodge.price.replace(/[^\d]/g, ''), 10);
    if (priceRange === 'under100k') return priceNum < 100000;
    if (priceRange === '100k-200k') return priceNum >= 100000 && priceNum <= 200000;
    if (priceRange === 'over200k') return priceNum > 200000;
    
    return true;
  });

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Search Header */}
        <div className="bg-[#008A4B] rounded-3xl p-8 text-white shadow-lg text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Map className="w-48 h-48" />
          </div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Find your perfect lodge.</h1>
            <p className="text-green-100 mb-8">Discover safe, affordable housing near your PPA or orientation camp.</p>
            
            <div className="bg-white p-2 rounded-2xl flex flex-col md:flex-row gap-2 shadow-xl">
              <div className="flex-1 relative">
                <MapPin className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Where are you serving?" 
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-0 text-slate-900"
                />
              </div>
              <div className="w-px bg-slate-200 hidden md:block my-2"></div>
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Lodge name, area..." 
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-0 text-slate-900"
                />
              </div>
              <Button className="bg-[#008A4B] hover:bg-[#006F3C] text-white py-3 px-8 rounded-xl h-auto">
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Filters and Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide items-center">
            <Button variant="outline" className="rounded-full bg-white whitespace-nowrap"><SlidersHorizontal className="w-4 h-4 mr-2" /> Filters</Button>
            <select 
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="px-4 py-2 text-sm font-medium rounded-full border border-slate-200 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#008A4B]/20"
            >
              <option value="all">Any Price</option>
              <option value="under100k">Under ₦100,000</option>
              <option value="100k-200k">₦100,000 - ₦200,000</option>
              <option value="over200k">Over ₦200,000</option>
            </select>
            <Button variant="outline" className="rounded-full bg-white whitespace-nowrap">Property Type</Button>
            <Button variant="outline" className="rounded-full bg-white whitespace-nowrap">Amenities</Button>
          </div>
          <div className="bg-white p-1 rounded-full border border-slate-200 flex">
            <Button 
              variant="ghost" 
              onClick={() => setViewMode('list')}
              className={`rounded-full px-6 h-8 text-xs font-bold ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}
            >
              List
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setViewMode('map')}
              className={`rounded-full px-6 h-8 text-xs font-bold ${viewMode === 'map' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}
            >
              <Map className="w-3 h-3 mr-1" /> Map
            </Button>
          </div>
        </div>

        {/* Content Area */}
        {filteredLodges.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 py-20 px-4 text-center flex flex-col items-center shadow-sm">
            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No lodges found</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-6">We couldn't find any lodges matching your current filters and search criteria.</p>
            <Button 
              onClick={() => { setPriceRange('all'); setSearchQuery(''); }}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
            >
              Clear Filters
            </Button>
          </div>
        ) : loading ? (
          <div className="py-20 flex justify-center"><p className="text-slate-500">Loading properties from database...</p></div>
        ) : viewMode === 'list' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredLodges.map((lodge) => (
              <div key={lodge.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition flex flex-col">
                <div className="relative h-48 w-full overflow-hidden block">
                  <Link href={`/member/listing/${lodge.id}`} className="absolute inset-0 z-0">
                    <Image src={lodge.image} alt={lodge.name} width={400} height={300} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  </Link>
                  <SavePropertyButton propertyId={lodge.id} initiallySaved={lodge.isSaved} iconOnly={true} />
                </div>
                <Link href={`/member/listing/${lodge.id}`} className="block flex-1 flex flex-col">
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{lodge.name}</h3>
                        <p className="flex items-center gap-1 text-sm font-bold text-slate-900"><Star className="w-3 h-3 text-amber-400 fill-current" /> {lodge.rating}</p>
                      </div>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3" /> {lodge.location}
                      </p>
                      <p className="text-xs text-slate-400 mb-3">{lodge.type}</p>
                      
                      <div className="flex flex-wrap gap-1 mb-4">
                        {lodge.tags.map((tag, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider">{tag}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                      <p className="font-bold text-[#008A4B]">{lodge.price}<span className="text-xs text-slate-500 font-normal">/yr</span></p>
                      <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-8 px-4" asChild>
                        <span>View</span>
                      </Button>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-100 rounded-3xl h-[600px] border border-slate-200 flex items-center justify-center relative overflow-hidden shadow-inner">
            {/* Mock map background pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#008A4B 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            <Map className="w-48 h-48 text-slate-200 absolute" />
            
            <div className="bg-white p-6 rounded-2xl shadow-xl relative z-10 text-center max-w-sm border border-slate-100">
               <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <MapPin className="w-8 h-8 text-[#008A4B]" />
               </div>
               <h3 className="text-lg font-bold text-slate-900 mb-2">Interactive Map View</h3>
               <p className="text-sm text-slate-500 mb-4">Explore lodges visually by location. This feature will connect to Google Maps in the final build.</p>
               <Button onClick={() => setViewMode('list')} variant="outline" className="w-full rounded-xl">
                 Return to List View
               </Button>
            </div>
            
            {/* Mock pins */}
            <div className="absolute top-1/4 left-1/4 bg-[#008A4B] text-white text-xs font-bold px-2 py-1 rounded-lg shadow-md animate-bounce">₦150k</div>
            <div className="absolute top-1/3 right-1/4 bg-[#008A4B] text-white text-xs font-bold px-2 py-1 rounded-lg shadow-md">₦200k</div>
            <div className="absolute bottom-1/3 left-1/2 bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-md">₦180k</div>
          </div>
        )}

      </div>
    </PageTransition>
  );
}
