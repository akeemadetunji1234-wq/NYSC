"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { MapPin, Check, X, ChevronLeft, ChevronRight, Clock, Home } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { ErrorState, EmptyState } from "../../components/shared/States";
import { getPendingProperties, updatePropertyStatus } from "../../app/actions/admin";

interface Listing {
  id: string;
  title: string;
  hostName: string;
  location: string;
  pricePerNight: string;
  submittedAt: string;
  bedrooms: number;
  images: string[];
  status: "pending";
}

export function ListingBacklogGrid() {
  const [data, setData] = useState<Listing[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchListings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const properties = await getPendingProperties();
      setData(properties as Listing[]);
    } catch {
      setError("Failed to load listing backlog.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchListings();
  }, []);

  const handleAction = async (id: string, status: "PUBLISHED" | "REJECTED", reason?: string) => {
    setActionId(id);
    try {
      await updatePropertyStatus(id, status, reason);
      setData((prev) => prev?.filter((listing) => listing.id !== id) ?? null);
      setRejectingId(null);
      setRejectionReason("");
    } catch (actionError) {
      console.error("Failed to update listing status", actionError);
      setError(actionError instanceof Error ? actionError.message : "Failed to update listing status.");
      await fetchListings();
    } finally {
      setActionId(null);
    }
  };

  const openReject = (id: string) => {
    setRejectingId(id);
    setRejectionReason("");
  };

  if (error && !data) return <ErrorState onRetry={fetchListings} />;
  if (isLoading) return <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><Skeleton className="h-48 w-full" /><div className="space-y-3 p-5"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-2/3" /><div className="flex gap-3 pt-2"><Skeleton className="h-10 flex-1 rounded-xl" /><Skeleton className="h-10 flex-1 rounded-xl" /></div></div></div>)}</div>;
  if (data?.length === 0) return <EmptyState icon={Home} title="Backlog is Clear!" description="There are no pending listings to review. All submissions have been processed." />;

  return (
    <div className="space-y-4">
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{error}</div>}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {data?.map((listing, idx) => {
            const images = listing.images?.filter(Boolean).slice(0, 5) || [];
            const activeIndex = Math.min(imageIndexes[listing.id] || 0, Math.max(images.length - 1, 0));
            const activeImage = images[activeIndex];
            return (
              <motion.div key={listing.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9, y: -20 }} transition={{ delay: idx * 0.05, type: "spring", stiffness: 300, damping: 25 }} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                <div className="relative flex h-52 items-center justify-center bg-slate-100">
                  {activeImage ? <Image src={activeImage} alt={`${listing.title} photo ${activeIndex + 1}`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-contain" /> : <Home className="h-12 w-12 text-slate-300" />}
                  <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm"><Clock className="h-3 w-3" /> Pending</div>
                  {images.length > 1 && <><button type="button" aria-label="Previous listing photo" onClick={() => setImageIndexes((prev) => ({ ...prev, [listing.id]: (activeIndex - 1 + images.length) % images.length }))} className="absolute left-2 top-1/2 rounded-full bg-white/90 p-1.5 text-slate-700 shadow-sm hover:bg-white"><ChevronLeft className="h-4 w-4" /></button><button type="button" aria-label="Next listing photo" onClick={() => setImageIndexes((prev) => ({ ...prev, [listing.id]: (activeIndex + 1) % images.length }))} className="absolute right-2 top-1/2 rounded-full bg-white/90 p-1.5 text-slate-700 shadow-sm hover:bg-white"><ChevronRight className="h-4 w-4" /></button></>}
                  <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-3 py-1 text-sm font-bold text-foreground shadow-sm">{listing.pricePerNight}<span className="text-xs font-normal text-muted-foreground">/yr</span></div>
                  {images.length > 0 && <span className="absolute bottom-3 right-3 rounded-lg bg-black/65 px-2 py-1 text-xs font-semibold text-white">Photo {activeIndex + 1} of {images.length}</span>}
                </div>
                {images.length > 1 && <div className="flex gap-2 overflow-x-auto border-b border-border bg-background p-2">{images.map((image, imageIndex) => <button type="button" key={`${image}-${imageIndex}`} onClick={() => setImageIndexes((prev) => ({ ...prev, [listing.id]: imageIndex }))} aria-label={`View listing photo ${imageIndex + 1}`} className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-md border-2 ${imageIndex === activeIndex ? "border-[#008A4B]" : "border-transparent"}`}><Image src={image} alt="" fill sizes="64px" className="object-cover" /></button>)}</div>}
                <div className="p-5"><h3 className="truncate text-base font-semibold text-foreground">{listing.title}</h3><div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{listing.location}</span></div><p className="mb-4 mt-1 text-xs text-slate-400">by <span className="font-medium text-muted-foreground">{listing.hostName}</span> · {listing.submittedAt} · {listing.bedrooms} bed{listing.bedrooms > 1 ? "s" : ""}</p>
                  {rejectingId === listing.id ? <div className="space-y-2"><label htmlFor={`reason-${listing.id}`} className="text-xs font-semibold text-foreground">Reason for rejection</label><textarea id={`reason-${listing.id}`} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} maxLength={2000} rows={3} placeholder="Tell the agent what to correct before resubmission." className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" /><div className="flex gap-2"><Button variant="outline" type="button" onClick={() => setRejectingId(null)} className="flex-1 rounded-xl text-sm">Cancel</Button><Button type="button" disabled={!rejectionReason.trim() || actionId === listing.id} onClick={() => void handleAction(listing.id, "REJECTED", rejectionReason)} className="flex-1 rounded-xl bg-rose-600 text-sm hover:bg-rose-700">{actionId === listing.id ? "Saving…" : "Confirm reject"}</Button></div></div> : <div className="flex items-center gap-2"><Button variant="outline" type="button" disabled={actionId === listing.id} className="flex-1 rounded-xl border-red-200 text-sm text-red-600 hover:border-red-300 hover:bg-red-50" onClick={() => openReject(listing.id)}><X className="mr-1 h-4 w-4" /> Reject</Button><Button type="button" disabled={actionId === listing.id} className="flex-1 rounded-xl bg-[#008A4B] text-sm hover:bg-[#006F3C]" onClick={() => void handleAction(listing.id, "PUBLISHED")}><Check className="mr-1 h-4 w-4" />{actionId === listing.id ? "Saving…" : "Approve"}</Button></div>}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
