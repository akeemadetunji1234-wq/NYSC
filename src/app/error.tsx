"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Home, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep provider logs useful without exposing the error message to visitors.
    console.error("Unhandled application route error", { digest: error.digest || "unavailable" });
  }, [error.digest]);

  return (
    <main className="na-shell flex min-h-screen items-center justify-center px-5 py-16">
      <section className="na-surface w-full max-w-lg rounded-3xl border p-8 text-center shadow-[var(--na-elevation-2)] md:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-600 dark:text-amber-300">
          <AlertTriangle className="h-8 w-8" aria-hidden="true" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-primary">Neat &amp; Affordable</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground">That page needs a refresh</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          Something interrupted this view. Your account and saved information are safe. Try again, or return to a stable page.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={() => reset()} className="gap-2 rounded-xl bg-primary text-primary-foreground hover:brightness-95">
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
          <Button asChild type="button" variant="outline" className="gap-2 rounded-xl">
            <Link href="/">
              <Home className="h-4 w-4" /> Home
            </Link>
          </Button>
          <Button type="button" variant="ghost" onClick={() => window.history.back()} className="gap-2 rounded-xl">
            <ArrowLeft className="h-4 w-4" /> Go back
          </Button>
        </div>
      </section>
    </main>
  );
}
