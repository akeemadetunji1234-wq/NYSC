"use client";

import { PageTransition } from "../../../components/layout/PageTransition";
import { NearbyEssentials } from "../../../components/shared/NearbyEssentials";
import { ShoppingBag } from "lucide-react";

export default function MarketplacePage() {
  return (
    <PageTransition>
      <div className="mx-auto min-h-screen max-w-6xl space-y-6 bg-background p-4 md:p-8">
        <header className="rounded-3xl bg-[#008A4B] p-6 text-white shadow-lg md:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white/15 p-3">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-100">Local marketplace</p>
              <h1 className="mt-1 text-2xl font-bold md:text-3xl">Find daily essentials around you</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-green-50 md:text-base">
                Discover supermarkets, restaurants, local markets, pharmacies, and other stores near your current location.
              </p>
            </div>
          </div>
        </header>

        <NearbyEssentials
          propertyCoords={null}
          propertyLabel="your location"
          title="Essentials near you"
        />

        <p className="text-center text-xs text-muted-foreground">
          Nearby places are searched live through Mapbox. Results may vary by location and provider coverage.
        </p>
      </div>
    </PageTransition>
  );
}
