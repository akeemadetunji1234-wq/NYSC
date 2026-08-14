import { prisma } from "./prisma";
import { requireRole } from "./authGuard";

export type PremiumPlan = "CORP_PREMIUM" | "AGENT_PREMIUM";

export const PREMIUM_PRICES = {
  CORP_PREMIUM: 5000,
  AGENT_PREMIUM: 10000,
} as const;

export function isPremiumActive(user: {
  isPremium?: boolean | null;
  premiumPlan?: string | null;
  premiumExpiry?: Date | string | null;
}, plan?: PremiumPlan) {
  if (!user.isPremium || (plan && user.premiumPlan !== plan)) return false;
  if (!user.premiumExpiry) return true;
  return new Date(user.premiumExpiry).getTime() > Date.now();
}

export async function getActiveEntitlement(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isBanned: true,
      isPremium: true,
      premiumPlan: true,
      premiumSince: true,
      premiumExpiry: true,
    },
  });
  if (!user || user.isBanned) return null;
  const plan = user.premiumPlan === "CORP_PREMIUM" || user.premiumPlan === "AGENT_PREMIUM"
    ? user.premiumPlan
    : null;
  if (!plan || !isPremiumActive(user, plan)) return null;
  return { ...user, premiumPlan: plan };
}

export async function requirePremium(plan: PremiumPlan): Promise<{ id: string; role: string; premiumPlan: PremiumPlan }> {
  const user = await requireRole(plan === "CORP_PREMIUM" ? "CORP" : "AGENT");
  const entitlement = await getActiveEntitlement(user.id);
  if (!entitlement || entitlement.premiumPlan !== plan) {
    throw new Error("PREMIUM_REQUIRED");
  }
  return { ...user, premiumPlan: plan };
}

export async function hasActivePremium(userId: string, plan: PremiumPlan) {
  const entitlement = await getActiveEntitlement(userId);
  return entitlement?.premiumPlan === plan;
}
