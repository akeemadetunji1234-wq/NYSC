"use client";

import { useState } from "react";
import { Share, X } from "lucide-react";
import { Button } from "../ui/button";

export function ShareListingButton({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  const showShareLink = async () => {
    const shareUrl = window.location.href;
    setUrl(shareUrl);
    setOpen(true);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
      } catch {
        // The visible link remains available when native sharing is cancelled.
      }
    }
  };

  return <>
    <Button variant="outline" onClick={showShareLink} className="rounded-full shadow-sm"><Share className="mr-2 h-4 w-4" /> Share</Button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Share listing" onClick={() => setOpen(false)}>
      <div className="w-full max-w-md rounded-2xl bg-background p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-bold">Share this listing</h2><button type="button" aria-label="Close" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button></div>
        <p className="mt-2 text-sm text-muted-foreground">The shareable link is ready. {copied ? "Copied to clipboard." : "Copy it or use your phone's share menu."}</p>
        <input readOnly value={url} onFocus={(event) => event.currentTarget.select()} className="mt-4 w-full rounded-xl border bg-secondary/30 p-3 text-xs" />
        <Button className="mt-3 w-full rounded-xl bg-[#008A4B] text-white" onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); }}>Copy link</Button>
      </div>
    </div>}
  </>;
}
