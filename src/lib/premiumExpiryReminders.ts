import { NotificationType } from "@prisma/client";
import { prisma } from "./prisma.ts";
import { createNotification } from "./notificationService.ts";
import { isEmailConfigured, sendPremiumExpiryReminderEmail } from "./email.ts";
import { PREMIUM_PRICES, type PremiumPlan } from "./premiumPlans.ts";

export const PREMIUM_REMINDER_THRESHOLDS_DAYS = [30, 7, 1] as const;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_EMAIL_ATTEMPTS = 5;
const EMAIL_RETRY_WINDOW_DAYS = 45;

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

export async function sendPendingPremiumExpiryReminderEmails(limit = 100) {
  if (!isEmailConfigured) {
    return { configured: false, attempted: 0, sent: 0, failed: 0, skipped: 0 };
  }

  const cutoff = new Date(Date.now() - EMAIL_RETRY_WINDOW_DAYS * DAY_MS);
  const pending = await prisma.notification.findMany({
    where: {
      type: NotificationType.PREMIUM_EXPIRY_REMINDER,
      emailDeliveredAt: null,
      emailDeliveryAttempts: { lt: MAX_EMAIL_ATTEMPTS },
      createdAt: { gte: cutoff },
      user: { email: { not: null } },
    },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "asc" },
    take: Math.min(Math.max(limit, 1), 100),
  });

  let attempted = 0;
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const notification of pending) {
    const email = notification.user.email;
    if (!email) {
      skipped += 1;
      continue;
    }

    const claim = await prisma.notification.updateMany({
      where: {
        id: notification.id,
        emailDeliveredAt: null,
        emailDeliveryAttempts: { lt: MAX_EMAIL_ATTEMPTS },
      },
      data: { emailDeliveryAttempts: { increment: 1 } },
    });
    if (claim.count !== 1) continue;

    attempted += 1;
    try {
      const planLabelFromBody = notification.title.replace(/ renewal reminder$/, "");
      const amount = planLabelFromBody === "Agent Premium"
        ? PREMIUM_PRICES.AGENT_PREMIUM.toLocaleString("en-NG")
        : PREMIUM_PRICES.CORP_PREMIUM.toLocaleString("en-NG");
      const renewalLink = notification.link || "/member/premium";
      const daysRemaining = notification.body.includes("tomorrow") ? 1 : notification.body.includes("7 days") ? 7 : 30;
      const expiryDate = notification.body.match(/on ([^.]+)\./)?.[1] || "your renewal date";

      await sendPremiumExpiryReminderEmail({
        to: email,
        planLabel: planLabelFromBody,
        amount,
        expiryDate,
        daysRemaining,
        renewalLink,
      });
      await prisma.notification.update({
        where: { id: notification.id },
        data: { emailDeliveredAt: new Date(), lastEmailError: null },
      });
      sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown email delivery error";
      await prisma.notification.update({
        where: { id: notification.id },
        data: { lastEmailError: message.slice(0, 1000) },
      });
      failed += 1;
    }
  }

  return { configured: true, attempted, sent, failed, skipped };
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

  const email = await sendPendingPremiumExpiryReminderEmails();
  return { scanned: users.length, created, duplicates, skipped, email };
}
