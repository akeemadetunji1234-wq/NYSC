"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireUser } from "../../lib/authGuard";
import { writeAuditLog } from "../../lib/audit";
import { isSimulatedPaymentsEnabled, simulateAnnualPremiumForUser } from "../../lib/premiumCheckout";
import { initializePaystackTransaction, isPaystackConfigured, verifyAndActivatePaystackPayment } from "../../lib/paystack";
import { prisma } from "../../lib/prisma";
import { PREMIUM_PRICES, type PremiumPlan } from "../../lib/premiumPlans";
import { rateLimit } from "../../lib/rateLimit";

const planSchema = z.enum(["CORP_PREMIUM", "AGENT_PREMIUM"]);

export async function getPremiumPaymentStatus() {
  return { paystackEnabled: isPaystackConfigured(), simulatedEnabled: isSimulatedPaymentsEnabled() };
}

export async function initializePremiumPaystackCheckout(rawPlan: unknown) {
  const debug = (stage: string, details?: Record<string, unknown>) => {
    console.info("[PAYSTACK_DEBUG] checkout", { stage, ...details });
  };

  debug("entered", { rawPlanType: typeof rawPlan });

  let paymentId: string | null = null;
  try {
    debug("before_require_user");
    const user = await requireUser();
    debug("after_require_user", { userId: user.id, role: user.role });
    const limit = await rateLimit(`paystack:init:${user.id}`, 5, 10 * 60 * 1000);
    debug("after_rate_limit", { allowed: limit.success });
    if (!limit.success) return { success: false as const, error: `Too many checkout attempts. Try again in ${limit.retryAfterSeconds} seconds.` };
    const parsedPlan = planSchema.safeParse(rawPlan);
    debug("after_plan_validation", { valid: parsedPlan.success });
    if (!parsedPlan.success) return { success: false as const, error: "Invalid premium plan." };
    const plan = parsedPlan.data;
    const expectedRole = plan === "CORP_PREMIUM" ? "CORP" : "AGENT";
    if (user.role !== expectedRole) return { success: false as const, error: "This premium plan is not available for your account role." };
    const configured = isPaystackConfigured();
    debug("paystack_configuration", { configured });
    if (!configured) return { success: false as const, error: "Paystack checkout is not configured yet." };

    const current = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, emailVerified: true, isBanned: true, isPremium: true, premiumPlan: true, premiumExpiry: true, role: true },
    });
    debug("after_user_lookup", { found: Boolean(current), emailPresent: Boolean(current?.email), emailVerified: Boolean(current?.emailVerified) });
    if (!current || current.isBanned) return { success: false as const, error: "Account is unavailable." };
    if (!current.email || !current.emailVerified) return { success: false as const, error: "Verify your email before purchasing premium." };
    if (current.role !== expectedRole) return { success: false as const, error: "The account role does not match this plan." };
    if (current.isPremium && current.premiumPlan === plan && current.premiumExpiry && current.premiumExpiry > new Date()) {
      return { success: false as const, error: "This premium plan is already active." };
    }

    const reference = `nysc-${randomUUID()}`;
    const payment = await prisma.premiumPayment.create({
      data: {
        userId: current.id,
        provider: "PAYSTACK",
        reference,
        plan,
        amount: PREMIUM_PRICES[plan],
        currency: "NGN",
        metadata: { source: "premium-page", role: current.role },
      },
    });
    paymentId = payment.id;
    debug("after_payment_create", { paymentId: payment.id, reference });

    const checkout = await initializePaystackTransaction({
      email: current.email,
      amountNaira: PREMIUM_PRICES[plan],
      reference,
      plan,
      paymentId: payment.id,
    });
    debug("after_paystack_initialize", { paymentId: payment.id, reference });
    await prisma.premiumPayment.update({ where: { id: payment.id }, data: { authorizationUrl: checkout.authorizationUrl } });
    try {
      await writeAuditLog("PREMIUM_PAYSTACK_CHECKOUT_INITIALIZED", current.id, `Paystack checkout initialized for ${plan}; reference ${reference}`);
    } catch (error) {
      console.error("Paystack initialization audit failed:", error);
    }
    return { success: true as const, ...checkout };
  } catch (error) {
    console.error("[PAYSTACK_DEBUG] checkout failed", error);
    const message = error instanceof Error ? error.message : "Paystack initialization failed.";
    debug("failed", { message: message.slice(0, 240) });
    if (paymentId) await markPaymentFailed(paymentId, error);
    return { success: false as const, error: message === "Unable to start Paystack checkout." ? message : "Unable to start Paystack checkout." };
  }
}

/* Keep payment cleanup isolated from the user-facing action error. */
async function markPaymentFailed(paymentId: string, error: unknown) {
  try {
    await prisma.premiumPayment.update({
      where: { id: paymentId },
      data: { status: "FAILED", failureReason: error instanceof Error ? error.message.slice(0, 500) : "Paystack initialization failed." },
    });
  } catch (cleanupError) {
    console.error("[PAYSTACK_DEBUG] failed to mark payment failed", cleanupError);
  }
}

export async function checkMyPaystackPaymentStatus(rawReference: unknown) {
  const user = await requireUser();
  const limit = await rateLimit(`paystack:status:${user.id}`, 10, 60 * 1000);
  if (!limit.success) throw new Error(`Too many status checks. Try again in ${limit.retryAfterSeconds} seconds.`);
  const reference = z.string().regex(/^[A-Za-z0-9.=\\-]{8,100}$/).parse(rawReference);
  const payment = await prisma.premiumPayment.findUnique({
    where: { reference },
    select: { userId: true },
  });
  if (!payment || payment.userId !== user.id) throw new Error("Payment reference not found for this account.");

  const result = await verifyAndActivatePaystackPayment(reference);
  return result;
}

export async function getSimulatedPaymentStatus() {
  return { enabled: isSimulatedPaymentsEnabled() };
}

export async function simulateAnnualPremiumCheckout(rawPlan: unknown) {
  const user = await requireUser();
  const plan = planSchema.parse(rawPlan);
  const expectedRole = plan === "CORP_PREMIUM" ? "CORP" : "AGENT";
  if (user.role !== expectedRole) throw new Error("This premium plan is not available for your account role.");

  const result = await simulateAnnualPremiumForUser(user.id, plan);
  await writeAuditLog(
    "PREMIUM_SIMULATED_PAYMENT",
    user.id,
    `Simulated annual payment recorded for ${plan}: NGN ${result.amount}; expires ${result.expiresAt}`,
  );
  return result;
}
