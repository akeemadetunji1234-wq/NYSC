import { z } from "zod";

export const transportFareRouteSchema = z.object({
  state: z.string().trim().min(1).max(120).optional(),
  from: z.string().trim().min(1).max(120),
  to: z.string().trim().min(1).max(120),
  mode: z.string().trim().min(1).max(80),
  minFare: z.number().finite().int().min(0).max(10_000_000),
  maxFare: z.number().finite().int().min(0).max(10_000_000),
  unit: z.string().trim().max(80).optional(),
  note: z.string().trim().max(500).optional(),
}).refine((route) => route.minFare <= route.maxFare, {
  message: "Minimum fare cannot exceed maximum fare",
  path: ["maxFare"],
});

export const transportGuideSchema = z.object({
  state: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).optional(),
  currency: z.literal("NGN").default("NGN"),
  routes: z.array(transportFareRouteSchema).min(1).max(500),
});

export type TransportFareRoute = z.infer<typeof transportFareRouteSchema>;
export type TransportGuide = z.infer<typeof transportGuideSchema>;

export function parseTransportGuideContent(content: string) {
  const parsed: unknown = JSON.parse(content);
  return transportGuideSchema.parse(parsed);
}

export function formatNairaRange(minFare: number, maxFare: number, currency = "NGN") {
  const formatter = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });
  const prefix = currency === "NGN" ? "₦" : `${currency} `;
  return `${prefix}${formatter.format(minFare)} – ${prefix}${formatter.format(maxFare)}`;
}
