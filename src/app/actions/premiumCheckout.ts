"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireUser } from "../../lib/authGuard";
import { writeAuditLog } from "../../lib/audit";
import { isSimulatedPaymentsEnabled, simulateAnnualPremiumForUser } from "../../lib/premiumCheckout";
import { initializePaystackTransaction, isPaystackConfigured, verifyAndActivatePaystackPayment } from "../../lib/paystack";
import { prisma } from "../../lib/prisma";
import { PREMIUM_PRICES, type PremiumPlan } from "../../lib/premiumPlans";

const planSchema = z.enum(["CORP_PREMIUM", "AGENT_PREMIUM"]);

export async function getPremiumPaymentStatus() {
  return { paystackEnabled: isPaystackConfigured(), simulatedEnabled: isSimulatedPaymentsEnabled() };
}

export async function initializePremiumPaystackCheckout(rawPlan: unknown) {
  const user = await requireUser();
  const plan = planSchema.parse(rawPlan);
  const expectedRole = plan === "CORP_PREMIUM" ? "CORP" : "AGENT";
  if (user.role !== expectedRole) throw new Error("This premium plan is not available for your account role.");
  if (!isPaystackConfigured()) throw new Error("Paystack checkout is not configured yet.");

  const current = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, emailVerified: true, isBanned: true, isPremium: true, premiumPlan: true, premiumExpiry: true, role: true },
  });
  if (!current || current.isBanned) throw new Error("Account is unavailable.");
  if (!current.email || !current.emailVerified) throw new Error("Verify your email before purchasing premium.");
  if (current.role !== expectedRole) throw new Error("The account role does not match this plan.");
  if (current.isPremium && current.premiumPlan === plan && current.premiumExpiry && current.premiumExpiry > new Date()) {
    throw new Error("This premium plan is already active.");
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

  try {
    const checkout = await initializePaystackTransaction({
      email: current.email,
      amountNaira: PREMIUM_PRICES[plan],
      reference,
      plan,
      paymentId: payment.id,
    });
    await prisma.premiumPayment.update({ where: { id: payment.id }, data: { authorizationUrl: checkout.authorizationUrl } });
    try {
      await writeAuditLog("PREMIUM_PAYSTACK_CHECKOUT_INITIALIZED", current.id, `Paystack checkout initialized for ${plan}; reference ${reference}`);
    } catch (error) {
      console.error("Paystack initialization audit failed:", error);
    }
    return checkout;
  } catch (error) {
    await prisma.premiumPayment.update({
      where: { id: payment.id },
      data: { status: "FAILED", failureReason: error instanceof Error ? error.message.slice(0, 500) : "Paystack initialization failed." },
    });
    throw new Error("Unable to start Paystack checkout.");
  }
}

export async function checkMyPaystackPaymentStatus(rawReference: unknown) {
  const user = await requireUser();
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
