"use client";

import { useState } from "react";
import { Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { initializePremiumPaystackCheckout } from "../actions/premiumCheckout";
import type { PremiumPlan } from "../../lib/premiumPlans";

export function PaystackCheckoutButton({ plan, price, className = "" }: { plan: PremiumPlan; price: string; className?: string }) {
  const [isStarting, setIsStarting] = useState(false);

  const handleCheckout = async () => {
    console.info("[PAYSTACK_DEBUG] client click", { plan });
    setIsStarting(true);
    try {
      console.info("[PAYSTACK_DEBUG] client invoking server action");
      const checkout = await initializePremiumPaystackCheckout(plan);
      console.info("[PAYSTACK_DEBUG] client received server action result", { success: checkout.success });
      if (!checkout.success) {
        toast.error(checkout.error);
        setIsStarting(false);
        return;
      }
      window.location.assign(checkout.authorizationUrl);
    } catch (error) {
      console.error("[PAYSTACK_DEBUG] client checkout failed", error);
      toast.error(error instanceof Error ? error.message : "Unable to start payment.");
      setIsStarting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCheckout()}
      disabled={isStarting}
      className={`relative w-full py-2.5 md:py-3 rounded-xl md:rounded-2xl bg-white text-[#008A4B] text-center text-sm font-bold shadow-lg cursor-pointer disabled:cursor-wait disabled:opacity-70 flex items-center justify-center gap-1.5 px-3 ${className}`}
    >
      {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4 shrink-0" />}
      <span>{isStarting ? "Opening secure checkout…" : `Pay ₦${price} once per annum with Paystack`}</span>
    </button>
  );
}
