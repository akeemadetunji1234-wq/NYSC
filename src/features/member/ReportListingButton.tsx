"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Flag, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { createListingReport } from "../../app/actions/report";

type ReportReason = "MISLEADING" | "UNSAFE" | "DUPLICATE" | "UNAVAILABLE" | "OTHER";

const reasons: Array<{ value: ReportReason; label: string }> = [
  { value: "MISLEADING", label: "Misleading information" },
  { value: "UNSAFE", label: "Safety concern" },
  { value: "DUPLICATE", label: "Duplicate listing" },
  { value: "UNAVAILABLE", label: "Listing is unavailable" },
  { value: "OTHER", label: "Other" },
];

export function ReportListingButton({ propertyId, userId }: { propertyId: string; userId?: string | null }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!reason || details.trim().length < 10) {
      toast.error("Choose a reason and provide at least 10 characters of detail.");
      return;
    }

    startTransition(async () => {
      try {
        await createListingReport({ propertyId, reason, details });
        toast.success("Thank you. Your report has been sent for review.");
        setOpen(false);
        setReason("");
        setDetails("");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to submit report.");
      }
    });
  };

  if (!userId) {
    return (
      <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
        <Link href={`/signin?callbackUrl=${encodeURIComponent(`/member/listing/${propertyId}`)}`}>
          <Flag className="w-4 h-4 mr-2" /> Report listing
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setOpen(true)}>
        <Flag className="w-4 h-4 mr-2" /> Report listing
      </Button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="report-listing-title">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="report-listing-title" className="text-lg font-bold text-foreground">Report this listing</h2>
                <p className="mt-1 text-sm text-muted-foreground">Help us keep listings accurate and safe. Reports are reviewed by the admin team.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="Close report dialog">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-foreground">
                Reason
                <select value={reason} onChange={(event) => setReason(event.target.value as ReportReason)} className="mt-2 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-[#008A4B]/30">
                  <option value="">Select a reason</option>
                  {reasons.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-foreground">
                Details
                <textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={2000} rows={5} placeholder="Tell us what appears inaccurate, unsafe, or unavailable." className="mt-2 w-full resize-none rounded-xl border border-border bg-secondary px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-[#008A4B]/30" />
              </label>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
                <Button type="button" onClick={submit} disabled={isPending} className="bg-[#008A4B] text-white hover:bg-[#006F3C]">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit report"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
