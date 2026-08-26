"use client";

import { Navigation, Footprints } from "lucide-react";
import dynamic from "next/dynamic";

const CommuteMap = dynamic(() => import("../CommuteMap"), { ssr: false });

interface CommuteEstimatorProps {
  propertyLat: number | null;
  propertyLng: number | null;
  initialPpa?: {
    ppaLatitude?: number | null;
    ppaLongitude?: number | null;
  } | null;
}

export function CommuteEstimator({
  propertyLat,
  propertyLng,
  initialPpa,
}: CommuteEstimatorProps) {
  const hasPropertyLocation = propertyLat != null && propertyLng != null;
  const hasPpaLocation =
    initialPpa?.ppaLatitude != null && initialPpa?.ppaLongitude != null;

  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-green-50 dark:bg-green-950/30 rounded-xl">
          <Navigation className="w-5 h-5 text-[#008A4B]" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">Lodge-to-PPA Distance</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            View the driving route between this lodge and your PPA.
          </p>
        </div>
      </div>

      {hasPropertyLocation && hasPpaLocation ? (
        <CommuteMap
          propertyCoords={{ lat: propertyLat, lng: propertyLng }}
          ppaCoords={{
            lat: initialPpa.ppaLatitude,
            lng: initialPpa.ppaLongitude,
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground border border-dashed border-border rounded-xl">
          <Footprints className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-xs">
            A saved PPA location is needed to display the lodge-to-PPA route.
          </p>
        </div>
      )}
    </div>
  );
}
