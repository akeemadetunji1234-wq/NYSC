"use client";

import { useState, useEffect } from "react";
import { MapPin, Check, X, Eye, Clock, Home } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { ErrorState, EmptyState } from "../../components/shared/States";

interface Listing {
  id: string;
  title: string;
  hostName: string;
  location: string;
  pricePerNight: string;
  submittedAt: string;
  bedrooms: number;
  status: "pending";
}

export function ListingBacklogGrid() {
  const [data, setData] = useState<Listing[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1800));
      const mockData: Listing[] = [
        { id: "L1", title: "Luxury 3-Bed Apartment in Lekki", hostName: "Folake Adebayo", location: "Lekki Phase 1, Lagos", pricePerNight: "₦45,000", submittedAt: "2 hours ago", bedrooms: 3, status: "pending" },
        { id: "L2", title: "Cozy Studio Near Aso Rock", hostName: "Ibrahim Musa", location: "Maitama, Abuja", pricePerNight: "₦25,000", submittedAt: "5 hours ago", bedrooms: 1, status: "pending" },
        { id: "L3", title: "Beachfront Villa with Pool", hostName: "Amina Bello", location: "Victoria Island, Lagos", pricePerNight: "₦120,000", submittedAt: "1 day ago", bedrooms: 5, status: "pending" },
        { id: "L4", title: "Modern 2-Bed in GRA", hostName: "Emeka Johnson", location: "GRA, Port Harcourt", pricePerNight: "₦35,000", submittedAt: "1 day ago", bedrooms: 2, status: "pending" },
        { id: "L5", title: "Penthouse Suite Ikoyi", hostName: "David Okon", location: "Ikoyi, Lagos", pricePerNight: "₦95,000", submittedAt: "3 days ago", bedrooms: 4, status: "pending" },
        { id: "L6", title: "Budget Flat Near University", hostName: "Zainab Usman", location: "Bodija, Ibadan", pricePerNight: "₦12,000", submittedAt: "4 days ago", bedrooms: 1, status: "pending" },
      ];
      setData(mockData);
    } catch (err: any) {
      setError("Failed to load listing backlog.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleAction = (id: string) => {
    setData((prev) => prev?.filter((listing) => listing.id !== id) ?? null);
  };

  if (error) return <ErrorState onRetry={fetchListings} />;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <Skeleton className="w-full h-48" />
            <div className="p-5 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-3 pt-2">
                <Skeleton className="h-10 flex-1 rounded-xl" />
                <Skeleton className="h-10 flex-1 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data?.length === 0) {
    return (
      <EmptyState
        icon={Home}
        title="Backlog is Clear!"
        description="There are no pending listings to review. All submissions have been processed."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence mode="popLayout">
        {data?.map((listing, idx) => (
          <motion.div
            key={listing.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ delay: idx * 0.08, type: "spring", stiffness: 300, damping: 25 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-shadow"
          >
            {/* Image placeholder with gradient */}
            <div className="relative w-full h-48 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-50 flex items-center justify-center">
              <Home className="w-12 h-12 text-slate-300" />
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 text-white rounded-full text-xs font-semibold shadow-sm">
                <Clock className="w-3 h-3" />
                Pending
              </div>
              <div className="absolute bottom-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-sm font-bold text-slate-900 shadow-sm">
                {listing.pricePerNight}<span className="text-xs font-normal text-slate-500">/night</span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5">
              <h3 className="font-semibold text-slate-900 text-base mb-1 truncate group-hover:text-[#008A4B] transition-colors">
                {listing.title}
              </h3>
              <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{listing.location}</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                by <span className="font-medium text-slate-600">{listing.hostName}</span> · {listing.submittedAt} · {listing.bedrooms} bed{listing.bedrooms > 1 ? "s" : ""}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl text-sm"
                  onClick={() => handleAction(listing.id)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button
                  className="flex-1 bg-[#008A4B] hover:bg-[#006F3C] rounded-xl text-sm"
                  onClick={() => handleAction(listing.id)}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
