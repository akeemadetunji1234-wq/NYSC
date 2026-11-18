"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Info, X } from "lucide-react";

export function WorkspaceRedirectNotice() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("redirected") !== "1") return;
    setVisible(true);
    router.replace(pathname, { scroll: false });
    const timer = window.setTimeout(() => setVisible(false), 8000);
    return () => window.clearTimeout(timer);
  }, [pathname, router, searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 top-4 z-[70] mx-auto flex max-w-xl items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-900 shadow-lg" role="status" aria-live="polite">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
      <p className="flex-1 text-sm font-medium">You were redirected to the workspace available for your account.</p>
      <button type="button" onClick={() => setVisible(false)} className="rounded-md p-1 text-sky-700 hover:bg-sky-100" aria-label="Dismiss workspace redirect notice">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
