"use client";

import { useState } from "react";
import { Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { initializePremiumPaystackCheckout } from "../actions/premiumCheckout";
import type { PremiumPlan } from "../../lib/premiumPlans";

export function PaystackCheckoutButton({ plan, price, className = "" }: { plan: PremiumPlan; price: string; className?: string }) {
  const [isStarting, setIsStarting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setIsStarting(true);
    setCheckoutError(null);
    try {
      const checkout = await Promise.race([
        initializePremiumPaystackCheckout(plan),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Paystack checkout timed out. Please try again.")), 25_000)),
      ]);
      if (!checkout.success) {
        setCheckoutError(checkout.error);
        toast.error(checkout.error);
        setIsStarting(false);
        return;
      }
      window.location.assign(checkout.authorizationUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start payment.";
      setCheckoutError(message);
      toast.error(message);
      setIsStarting(false);
    }
  };

  return (
    <>
      <button
      type="button"
      onClick={() => void handleCheckout()}
      disabled={isStarting}
      className={`relative w-full py-2.5 md:py-3 rounded-xl md:rounded-2xl bg-white text-[#008A4B] text-center text-sm font-bold shadow-lg cursor-pointer disabled:cursor-wait disabled:opacity-70 flex items-center justify-center gap-1.5 px-3 ${className}`}
    >
      {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4 shrink-0" />}
      <span>{isStarting ? "Opening secure checkout…" : `Pay ₦${price} once per annum with Paystack`}</span>
      </button>
      {checkoutError && <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-700">{checkoutError}</p>}
    </>
  );
}
