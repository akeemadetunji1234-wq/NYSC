"use client";

import { Share2 } from "lucide-react";

export function ShareSafetyLinkButton({ token }: { token: string }) {
  const share = async () => {
    const url = `${window.location.origin}/safety-checkin/${token}`;
    try {
      if (navigator.share) await navigator.share({ title: "Safety check-in", text: "View my safety check-in status", url });
      else await navigator.clipboard.writeText(url);
    } catch {
      // Native share cancellation is not an error; the link remains visible.
    }
  };
  return <button type="button" onClick={share} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800"><Share2 className="h-3.5 w-3.5" /> Share link</button>;
}
