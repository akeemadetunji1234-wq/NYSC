"use server";

import { z } from "zod";
import { requireUser } from "../../lib/authGuard";
import { writeAuditLog } from "../../lib/audit";
import { isSimulatedPaymentsEnabled, simulateAnnualPremiumForUser } from "../../lib/premiumCheckout";

const planSchema = z.enum(["CORP_PREMIUM", "AGENT_PREMIUM"]);

export async function getSimulatedPaymentStatus() {
  return { enabled: isSimulatedPaymentsEnabled() };
}

export async function simulateAnnualPremiumCheckout(rawPlan: unknown) {
  const user = await requireUser();
  const plan = planSchema.parse(rawPlan);
  const expectedRole = plan === "CORP_PREMIUM" ? "CORP" : "AGENT";
  if (user.role !== expectedRole) {
    throw new Error("This premium plan is not available for your account role.");
  }

  const result = await simulateAnnualPremiumForUser(user.id, plan);
  await writeAuditLog(
    "PREMIUM_SIMULATED_PAYMENT",
    user.id,
    `Simulated annual payment recorded for ${plan}: NGN ${result.amount}; expires ${result.expiresAt}`,
  );
  return result;
}
