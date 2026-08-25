export type PremiumPlan = "CORP_PREMIUM" | "AGENT_PREMIUM";

export const PREMIUM_PRICES = {
  CORP_PREMIUM: 5_000,
  AGENT_PREMIUM: 10_000,
} as const;

export const PREMIUM_TERM_LABEL = "per annum";
export const PREMIUM_DURATION_YEARS = 1;
