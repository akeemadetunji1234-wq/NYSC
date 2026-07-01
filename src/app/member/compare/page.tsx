import { PageTransition } from "../../../components/layout/PageTransition";
import { getPropertiesByIds } from "../../actions/property";
import { ArrowLeft, Check, X, ShieldAlert, Star, Trophy } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../../../components/ui/button";

interface ComparePageProps {
  searchParams: Promise<{ ids?: string }>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = await searchParams;
  const ids = params.ids?.split(",").filter(Boolean) || [];

  if (ids.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50 text-center">
        <ShieldAlert className="w-12 h-12 text-slate-400 mb-4" />
        <h1 className="text-xl font-bold text-foreground">No properties selected</h1>
        <p className="text-muted-foreground text-sm max-w-sm mt-2">Go back to the listings page and select properties to compare side-by-side.</p>
        <Link href="/member" className="mt-6">
          <Button className="bg-[#008A4B] hover:bg-[#006F3C] text-white rounded-xl font-bold">
            Back to Explore
          </Button>
        </Link>
      </div>
    );
  }

  const properties = await getPropertiesByIds(ids);

  // Identify lowest price property for Best Value highlight
  let bestValueId: string | null = null;
  if (properties.length > 0) {
    const sorted = [...properties].sort((a, b) => a.price - b.price);
    bestValueId = sorted[0].id;
  }

  // Aggregate all unique amenities across these properties
  const allUniqueAmenities = Array.from(
    new Set(properties.flatMap(p => p.amenities))
  );

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
        <div className="flex items-center gap-3">
          <Link href="/member">
            <button className="p-2 border border-border bg-card rounded-xl hover:bg-secondary transition-colors cursor-pointer text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Property Comparison</h1>
            <p className="text-muted-foreground text-xs mt-0.5">Compare features, pricing, and locations to find your perfect stay.</p>
          </div>
        </div>

        {/* Matrix Comparison Container */}
        <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  {/* Left Column Label spacer */}
                  <th className="px-6 py-8 w-1/5 min-w-[150px] font-bold text-muted-foreground uppercase text-xs tracking-wider">
                    Features
                  </th>
                  {/* Properties Headers */}
                  {properties.map(p => {
                    const isBest = p.id === bestValueId;
                    return (
                      <th 
                        key={p.id} 
                        className={`px-6 py-6 w-1/4 relative border-l border-border transition-all ${
                          isBest ? "bg-amber-500/[0.02]" : ""
                        }`}
                      >
                        {isBest && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                        )}
                        <div className="space-y-4">
                          <div className="relative h-28 w-full rounded-xl overflow-hidden border border-border shadow-inner">
                            <Image 
                              src={p.images[0] || "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600"} 
                              alt={p.title} 
                              fill 
                              className="object-cover" 
                            />
                            {isBest && (
                              <div className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider shadow-sm">
                                <Trophy className="w-2.5 h-2.5 fill-current" /> Best Value
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground line-clamp-1">{p.title}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.location}</p>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* Row: Price */}
                <tr className="hover:bg-secondary/20 transition">
                  <td className="px-6 py-5 font-bold text-slate-500 uppercase text-xs tracking-wider">
                    Yearly Rent
                  </td>
                  {properties.map(p => {
                    const isBest = p.id === bestValueId;
                    return (
                      <td 
                        key={p.id} 
                        className={`px-6 py-5 border-l border-border transition-all ${
                          isBest ? "bg-amber-500/[0.02]" : ""
                        }`}
                      >
                        <p className={`text-base font-black ${isBest ? "text-amber-600" : "text-[#008A4B]"}`}>
                          ₦{p.price.toLocaleString()}
                          <span className="text-xs text-muted-foreground font-normal">/yr</span>
                        </p>
                      </td>
                    );
                  })}
                </tr>

                {/* Row: Location details */}
                <tr className="hover:bg-secondary/20 transition">
                  <td className="px-6 py-5 font-bold text-slate-500 uppercase text-xs tracking-wider">
                    LGA / State
                  </td>
                  {properties.map(p => (
                    <td key={p.id} className="px-6 py-5 border-l border-border text-muted-foreground font-medium">
                      {p.lga}, {p.state}
                    </td>
                  ))}
                </tr>

                {/* Row: Rooms */}
                <tr className="hover:bg-secondary/20 transition">
                  <td className="px-6 py-5 font-bold text-slate-500 uppercase text-xs tracking-wider">
                    Rooms
                  </td>
                  {properties.map(p => (
                    <td key={p.id} className="px-6 py-5 border-l border-border font-medium text-foreground">
                      {p.bedrooms} Bed / {p.bathrooms} Bath
                    </td>
                  ))}
                </tr>

                {/* Amenities Headers */}
                <tr>
                  <td colSpan={properties.length + 1} className="bg-secondary/30 px-6 py-3 font-bold text-slate-600 uppercase text-xs tracking-wider">
                    Amenities Check
                  </td>
                </tr>

                {/* Row: Amenities Map */}
                {allUniqueAmenities.map(amenity => (
                  <tr key={amenity} className="hover:bg-secondary/20 transition">
                    <td className="px-6 py-4 font-bold text-slate-400 capitalize text-xs">
                      {amenity}
                    </td>
                    {properties.map(p => {
                      const hasAmenity = p.amenities.includes(amenity);
                      return (
                        <td key={p.id} className="px-6 py-4 border-l border-border">
                          {hasAmenity ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-50 text-[#008A4B] border border-green-150">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                              <X className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Actions row */}
                <tr className="bg-secondary/10">
                  <td className="px-6 py-6"></td>
                  {properties.map(p => (
                    <td key={p.id} className="px-6 py-6 border-l border-border">
                      <Link href={`/member/listing/${p.id}`}>
                        <Button className="w-full bg-[#008A4B] hover:bg-[#006F3C] text-white text-xs rounded-xl font-bold h-9 shadow-sm cursor-pointer">
                          View Listing
                        </Button>
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
