import { NotificationType } from "@prisma/client";
import { prisma } from "./prisma.ts";
import { createNotification } from "./notificationService.ts";
import { getPremiumExpiry, PREMIUM_PRICES, type PremiumPlan } from "./premiumPlans.ts";

export function isSimulatedPaymentsEnabled() {
  const enabled = process.env.SIMULATED_PAYMENTS_ENABLED === "true";
  const productionOverride = process.env.SIMULATED_PAYMENTS_ALLOW_PRODUCTION === "true";
  return enabled && (process.env.NODE_ENV !== "production" || productionOverride);
}

export async function simulateAnnualPremiumForUser(userId: string, plan: PremiumPlan) {
  if (!isSimulatedPaymentsEnabled()) {
    throw new Error("Simulated payments are disabled. Configure them only in a test environment.");
  }

  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { premiumExpiry: true, role: true, email: true },
  });
  if (!current) throw new Error("User account not found.");

  const expectedRole = plan === "CORP_PREMIUM" ? "CORP" : "AGENT";
  if (current.role !== expectedRole) {
    throw new Error("This premium plan is not available for the account role.");
  }

  const now = new Date();
  const startsAt = current.premiumExpiry && current.premiumExpiry > now ? current.premiumExpiry : now;
  const expiresAt = getPremiumExpiry(startsAt);
  const amount = PREMIUM_PRICES[plan];

  await prisma.user.update({
    where: { id: userId },
    data: {
      isPremium: true,
      premiumPlan: plan,
      premiumSince: now,
      premiumExpiry: expiresAt,
    },
  });


  await createNotification(
    userId,
    NotificationType.PREMIUM_PAYMENT_SIMULATED,
    "Premium test payment completed",
    `Simulated annual checkout completed for ₦${amount.toLocaleString("en-NG")}. Premium access is active until ${expiresAt.toLocaleDateString("en-NG")}.`,
    plan === "CORP_PREMIUM" ? "/member/premium" : "/agent/premium",
  );

  return {
    success: true,
    plan,
    amount,
    startsAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  } as const;
}
