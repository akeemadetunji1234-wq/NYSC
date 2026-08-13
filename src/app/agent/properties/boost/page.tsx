"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageTransition } from "../../../../components/layout/PageTransition";
import { Megaphone, TrendingUp, Zap, ChevronRight, Star, Image as ImageIcon, CheckCircle, RefreshCw, Crown } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { getAgentProperties, boostProperty } from "../../../actions/property";
import { getAgentProfile } from "../../../actions/agent";
import { toast } from "sonner";

interface BoostProperty {
  id: string;
  title: string;
  location: string;
  images: string[];
  status: string;
  isBoosted: boolean;
  boostedUntil: Date | string | null;
}

export default function BoostListingsPage() {
  const [properties, setProperties] = useState<BoostProperty[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpiry, setPremiumExpiry] = useState<Date | string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const loadProperties = async () => {
    setIsLoading(true);
    try {
      const [propertyData, profile] = await Promise.all([getAgentProperties(), getAgentProfile()]);
      const premiumActive = Boolean(profile?.isPremium && profile?.premiumPlan === "AGENT_PREMIUM" && (!profile?.premiumExpiry || new Date(profile.premiumExpiry) > new Date()));
      setIsPremium(premiumActive);
      setPremiumExpiry(profile?.premiumExpiry || null);
      setProperties(propertyData.filter((p: any) => p.status === "PUBLISHED") as BoostProperty[]);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch boosting data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
    const interval = setInterval(loadProperties, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleBoost = async (propertyId: string) => {
    setActiveId(propertyId);
    try {
      const res = await boostProperty(propertyId);
      if (res.success) {
        toast.success("Listing boosted for 30 days.");
        await loadProperties();
      } else {
        toast.error(res.error || "Unable to boost listing");
      }
    } catch (error: any) {
      toast.error(error.message || "Unable to boost listing");
    } finally {
      setActiveId(null);
    }
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">Featured Boosting <Megaphone className="w-6 h-6 text-blue-600" /></h1>
            <p className="text-muted-foreground mt-1">Promote published properties to the top of the live member search results.</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadProperties} disabled={isLoading} className="gap-2"><RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh</Button>
        </div>

        <div className={`rounded-2xl border p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isPremium ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900" : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"}`}>
          <div className="flex items-start gap-3"><Crown className={`w-5 h-5 mt-0.5 ${isPremium ? "text-emerald-600" : "text-amber-600"}`} /><div><p className="font-bold text-foreground">{isPremium ? "Agent Premium is active" : "Agent Premium is required"}</p><p className="text-sm text-muted-foreground">{isPremium && premiumExpiry ? `Your access is active until ${new Date(premiumExpiry).toLocaleDateString()}.` : "Featured Boosting is a paid premium feature. Upgrade before boosting a listing."}</p></div></div>
          {!isPremium && <Link href="/agent/premium"><Button size="sm" className="bg-[#008A4B] hover:bg-[#00703C] text-white">View Premium</Button></Link>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border"><h2 className="text-lg font-bold text-foreground">Published listings</h2><p className="text-sm text-muted-foreground">Boost status refreshes automatically from the database.</p></div>
            <div className="p-6 space-y-4">
              {isLoading ? <p className="text-sm text-muted-foreground text-center py-8">Loading properties...</p> : properties.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">You have no published properties to boost.</p> : properties.map((property) => {
                const activeBoost = property.isBoosted && property.boostedUntil && new Date(property.boostedUntil) > new Date();
                return <div key={property.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-border hover:border-blue-300 transition gap-4">
                  <div className="flex gap-4 items-center min-w-0"><div className="w-16 h-16 bg-slate-200 rounded-lg overflow-hidden shrink-0 relative">{property.images?.[0] ? <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100"><ImageIcon className="w-6 h-6" /></div>}</div><div className="min-w-0"><h4 className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-[300px]">{property.title}</h4><p className="text-xs text-muted-foreground truncate">{property.location}</p><div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-slate-500 uppercase">{activeBoost ? <><Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> Boost active until {new Date(property.boostedUntil!).toLocaleDateString()}</> : <><Star className="w-3 h-3 text-slate-400" /> Standard listing</>}</div></div></div>
                  {activeBoost ? <Button disabled className="w-full sm:w-auto bg-emerald-50 text-emerald-700 hover:bg-emerald-50 shadow-none font-semibold border border-emerald-200">Boosted <CheckCircle className="w-4 h-4 ml-1" /></Button> : <Button onClick={() => handleBoost(property.id)} disabled={!isPremium || activeId === property.id} className="w-full sm:w-auto bg-blue-50 text-blue-700 hover:bg-blue-100 shadow-none font-semibold">{activeId === property.id ? "Activating..." : "Boost Now"} <Zap className="w-4 h-4 ml-1" /></Button>}
                </div>;
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden h-fit"><div className="absolute -right-4 -top-4 opacity-10"><TrendingUp className="w-32 h-32" /></div><div className="relative z-10"><div className="flex items-center gap-2 text-blue-200 font-bold text-xs uppercase tracking-wider mb-2"><Zap className="w-4 h-4 text-amber-300" /> Premium Feature</div><h3 className="text-xl font-bold mb-2">How boosting works</h3><ul className="space-y-3 text-sm text-blue-100"><li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-blue-300" /> Top position in member search</li><li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-blue-300" /> Featured treatment for 30 days</li><li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-blue-300" /> Real views and saves in analytics</li></ul></div></div>
        </div>
      </div>
    </PageTransition>
  );
}
