import { NotificationType } from "@prisma/client";
import { prisma } from "./prisma.ts";
import { createNotification } from "./notificationService.ts";
import { PREMIUM_PRICES, type PremiumPlan } from "./premiumPlans.ts";

export const PREMIUM_REMINDER_THRESHOLDS_DAYS = [30, 7, 1] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

type PremiumUser = {
  id: string;
  name: string | null;
  email: string | null;
  premiumPlan: string | null;
  premiumExpiry: Date | null;
};

function isPremiumPlan(value: string | null): value is PremiumPlan {
  return value === "CORP_PREMIUM" || value === "AGENT_PREMIUM";
}

function reminderLink(plan: PremiumPlan) {
  return plan === "CORP_PREMIUM" ? "/member/premium" : "/agent/premium";
}

function planLabel(plan: PremiumPlan) {
  return plan === "CORP_PREMIUM" ? "Corp Member Premium" : "Agent Premium";
}

function formatExpiry(expiry: Date) {
  return expiry.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
}

function isDuplicateNotification(error: unknown) {
  return (error as { code?: string } | null)?.code === "P2002";
}

export async function createPremiumExpiryReminders(now = new Date()) {
  const windowEnd = new Date(now.getTime() + PREMIUM_REMINDER_THRESHOLDS_DAYS[0] * DAY_MS);
  const users = await prisma.user.findMany({
    where: {
      isPremium: true,
      premiumPlan: { in: ["CORP_PREMIUM", "AGENT_PREMIUM"] },
      premiumExpiry: { gt: now, lte: windowEnd },
      role: { in: ["CORP", "AGENT"] },
    },
    select: { id: true, name: true, email: true, premiumPlan: true, premiumExpiry: true },
  });

  let created = 0;
  let duplicates = 0;
  let skipped = 0;

  for (const user of users as PremiumUser[]) {
    if (!user.premiumExpiry || !isPremiumPlan(user.premiumPlan)) {
      skipped += 1;
      continue;
    }

    const daysRemaining = Math.ceil((user.premiumExpiry.getTime() - now.getTime()) / DAY_MS);
    const threshold = PREMIUM_REMINDER_THRESHOLDS_DAYS
      .filter((value) => daysRemaining <= value)
      .at(-1);
    if (threshold === undefined) continue;

    const dedupeKey = `premium-expiry:${user.id}:${user.premiumExpiry.toISOString()}:${threshold}`;
    const title = `${planLabel(user.premiumPlan)} renewal reminder`;
    const amount = PREMIUM_PRICES[user.premiumPlan].toLocaleString("en-NG");
    const timing = daysRemaining <= 1 ? "tomorrow" : `in about ${daysRemaining} days`;
    const body = `${planLabel(user.premiumPlan)} expires ${timing} on ${formatExpiry(user.premiumExpiry)}. The annual renewal price is ₦${amount} as a one-time payment. Contact an administrator before expiry to renew your access.`;

    try {
      await createNotification(
        user.id,
        NotificationType.PREMIUM_EXPIRY_REMINDER,
        title,
        body,
        reminderLink(user.premiumPlan),
        { dedupeKey },
      );
      created += 1;
    } catch (error) {
      if (isDuplicateNotification(error)) {
        duplicates += 1;
        continue;
      }
      throw error;
    }
  }

  return { scanned: users.length, created, duplicates, skipped };
}
