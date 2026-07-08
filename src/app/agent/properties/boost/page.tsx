"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PageTransition } from "../../../../components/layout/PageTransition";
import { Megaphone, TrendingUp, Zap, ChevronRight, Star, Image as ImageIcon, CheckCircle } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { getAgentProperties, boostProperty } from "../../../actions/property";

export default function BoostListingsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProperties() {
      if (!userId) return;
      try {
        const data = await getAgentProperties(userId);
        // Only show PUBLISHED properties that can be boosted
        setProperties(data.filter((p: any) => p.status === "PUBLISHED"));
      } catch (error) {
        console.error("Failed to fetch properties for boosting:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadProperties();
    const interval = setInterval(loadProperties, 15000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleBoost = async (propertyId: string) => {
    setIsLoading(true);
    try {
      const res = await boostProperty(propertyId);
      if (res && res.success) {
        setProperties(properties.map(p => p.id === propertyId ? { ...p, isBoosted: true } : p));
      } else {
        alert("Failed to boost property. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Error occurred while boosting property.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            Boost Listings
            <Megaphone className="w-6 h-6 text-blue-600" />
          </h1>
          <p className="text-muted-foreground mt-1">Get up to 10x more visibility by pushing your properties to the top of search results.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active Boosts */}
          <div className="md:col-span-2 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Your Active Properties</h2>
              <p className="text-sm text-muted-foreground">Select a listing to apply a boost</p>
            </div>
            <div className="p-6 space-y-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading properties...</p>
              ) : properties.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">You have no active properties to boost. Please publish a property first.</p>
              ) : properties.map((property) => (
                <div key={property.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-border hover:border-blue-300 transition gap-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-slate-200 rounded-lg overflow-hidden shrink-0 relative">
                      {property.images && property.images.length > 0 ? (
                        <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-[300px]">{property.title}</h4>
                      <p className="text-xs text-muted-foreground">{property.location}</p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-slate-500 uppercase">
                        {property.isBoosted ? (
                          <><Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> Premium Boosted</>
                        ) : (
                          <><Star className="w-3 h-3 text-slate-400" /> Standard Listing</>
                        )}
                      </div>
                    </div>
                  </div>
                  {property.isBoosted ? (
                    <Button disabled className="w-full sm:w-auto bg-emerald-50 text-emerald-700 hover:bg-emerald-50 shadow-none font-semibold border border-emerald-200">
                      Boosted <CheckCircle className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleBoost(property.id)}
                      className="w-full sm:w-auto bg-blue-50 text-blue-700 hover:bg-blue-100 shadow-none font-semibold"
                    >
                      Boost Now <Zap className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Boost Packages */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10">
                <TrendingUp className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-blue-200 font-bold text-xs uppercase tracking-wider mb-2">
                  <Zap className="w-4 h-4 text-amber-300" /> Premium Feature
                </div>
                <h3 className="text-xl font-bold mb-2">Why Boost?</h3>
                <ul className="space-y-3 text-sm text-blue-100 mb-6">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-blue-300" /> Appear at the top of searches
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-blue-300" /> Highlighted "Featured" badge
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-blue-300" /> Instant notification to users nearby
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
