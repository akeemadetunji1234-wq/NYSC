"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { checkMyPaystackPaymentStatus } from "../actions/premiumCheckout";

type PaymentResult = "success" | "failed" | "cancelled" | null;

type Props = {
  result: PaymentResult;
  reference?: string | null;
};

export function PaystackPaymentStatus({ result, reference }: Props) {
  const router = useRouter();
  const { update } = useSession();
  const [isChecking, setIsChecking] = useState(false);

  if (!result) return null;

  const checkStatus = async () => {
    if (!reference) {
      toast.error("No payment reference was provided. Start checkout again if you were charged.");
      return;
    }
    setIsChecking(true);
    try {
      const verified = await checkMyPaystackPaymentStatus(reference);
      await update();
      router.refresh();
      toast.success(verified.alreadyProcessed ? "Payment was already confirmed." : "Payment confirmed. Premium is now active.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment is not confirmed yet.");
    } finally {
      setIsChecking(false);
    }
  };

  if (result === "success") {
    return (
      <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 shadow-sm">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">Payment verification completed</p>
            <p className="mt-1 text-sm">Your premium status is being refreshed. Reference: <span className="break-all font-mono text-xs">{reference || "unavailable"}</span></p>
            <button type="button" onClick={() => void checkStatus()} disabled={isChecking} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-800 disabled:opacity-60">
              {isChecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Refresh premium status
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (result === "cancelled") {
    return (
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm">
        <div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><p className="font-bold">Payment was cancelled</p><p className="mt-1 text-sm">No premium access was granted. You can safely try again when you are ready.</p></div></div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 shadow-sm">
      <div className="flex items-start gap-3">
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
        <div className="min-w-0 flex-1">
          <p className="font-bold">Payment needs attention</p>
          <p className="mt-1 text-sm">The payment was not confirmed, so premium access was not granted. If your bank shows a pending debit, keep the reference and contact support before trying again.</p>
          {reference && <p className="mt-2 break-all font-mono text-xs">Reference: {reference}</p>}
          <button type="button" onClick={() => void checkStatus()} disabled={isChecking || !reference} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-bold text-rose-800 disabled:opacity-60">
            {isChecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Check payment again
          </button>
        </div>
      </div>
    </div>
  );
}
