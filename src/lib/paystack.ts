import { createHmac, timingSafeEqual } from "node:crypto";
import { NotificationType, PremiumPaymentStatus } from "@prisma/client";
import { prisma } from "./prisma.ts";
import { createNotification } from "./notificationService.ts";
import { getPremiumExpiry, type PremiumPlan } from "./premiumPlans.ts";
import { safeOutboundFetch } from "./safeOutboundFetch.ts";

const PAYSTACK_API_BASE = "https://api.paystack.co";
const PAYSTACK_CURRENCY = "NGN";
const PAYSTACK_TIMEOUT_MS = 15_000;

type PaystackResponse<T> = { status: boolean; message: string; data: T };

type PaystackInitializeData = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

type PaystackVerifyData = {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at?: string | null;
  customer?: { email?: string | null } | null;
};

function getSecretKey() {
  return process.env.PAYSTACK_SECRET_KEY?.trim() || null;
}

function getApplicationUrl() {
  const configuredUrl = process.env.PAYSTACK_CALLBACK_URL || process.env.NEXTAUTH_URL || process.env.BASE_URL || "";
  const trimmedUrl = configuredUrl.trim().replace(/\/$/, "");
  if (!trimmedUrl) return "";

  try {
    const parsed = new URL(trimmedUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function getHeaders() {
  const secretKey = getSecretKey();
  if (!secretKey) throw new Error("Paystack is not configured. Add PAYSTACK_SECRET_KEY on the server.");
  return {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
  };
}

async function paystackRequest<T>(path: string, init: RequestInit) {
  const response = await safeOutboundFetch(`${PAYSTACK_API_BASE}${path}`, {
    ...init,
    headers: { ...getHeaders(), ...(init.headers || {}) },
  }, {
    allowedHosts: ["api.paystack.co"],
    timeoutMs: PAYSTACK_TIMEOUT_MS,
    maxResponseBytes: 256_000,
  });
  const payload = await response.json().catch(() => null) as PaystackResponse<T> | null;
  if (!response.ok || !payload?.status) {
    throw new Error(payload?.message || `Paystack request failed (${response.status}).`);
  }
  return payload.data;
}

function isPremiumPlan(value: string): value is PremiumPlan {
  return value === "CORP_PREMIUM" || value === "AGENT_PREMIUM";
}

export function isPaystackConfigured() {
  return Boolean(getSecretKey());
}

export function getPaystackConfig() {
  return { configured: isPaystackConfigured(), currency: PAYSTACK_CURRENCY };
}

export async function initializePaystackTransaction(input: {
  email: string;
  amountNaira: number;
  reference: string;
  plan: PremiumPlan;
  paymentId: string;
}) {
  const applicationUrl = getApplicationUrl();
  if (!applicationUrl) throw new Error("PAYSTACK_CALLBACK_URL, NEXTAUTH_URL, or BASE_URL must be a valid HTTP(S) URL for Paystack callbacks.");

  if (!Number.isSafeInteger(input.amountNaira) || input.amountNaira <= 0) {
    throw new Error("Paystack amount must be a positive whole number of naira.");
  }

  const data = await paystackRequest<PaystackInitializeData>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: String(input.amountNaira * 100),
      currency: PAYSTACK_CURRENCY,
      reference: input.reference,
      callback_url: `${applicationUrl}/api/payments/paystack/callback`,
      channels: ["card", "bank", "bank_transfer", "ussd"],
      metadata: JSON.stringify({ paymentId: input.paymentId, plan: input.plan }),
    }),
  });

  return {
    authorizationUrl: data.authorization_url,
    accessCode: data.access_code,
    reference: data.reference,
  };
}

export async function verifyPaystackTransaction(reference: string) {
  return paystackRequest<PaystackVerifyData>(`/transaction/verify/${encodeURIComponent(reference)}`, {
    method: "GET",
  });
}

export function verifyPaystackWebhookSignature(rawBody: string, signature: string | null) {
  const secretKey = getSecretKey();
  if (!secretKey || !signature) return false;
  const expected = createHmac("sha512", secretKey).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function verifyAndActivatePaystackPayment(reference: string) {
  const payment = await prisma.premiumPayment.findUnique({
    where: { reference },
    include: { user: { select: { id: true, role: true, email: true, isBanned: true, premiumExpiry: true } } },
  });
  if (!payment) throw new Error("Payment reference not found.");
  if (!isPremiumPlan(payment.plan)) throw new Error("Payment plan is invalid.");
  if (payment.provider !== "PAYSTACK") throw new Error("Payment provider is invalid.");
  if (payment.user.isBanned) throw new Error("The account is not eligible for premium activation.");

  const expectedRole = payment.plan === "CORP_PREMIUM" ? "CORP" : "AGENT";
  if (payment.user.role !== expectedRole) throw new Error("Payment plan does not match the account role.");

  if (payment.status === PremiumPaymentStatus.SUCCESS) {
    return { success: true, alreadyProcessed: true, plan: payment.plan, role: payment.user.role, expiresAt: payment.user.premiumExpiry?.toISOString() || null } as const;
  }

  const verified = await verifyPaystackTransaction(reference);
  const expectedAmount = payment.amount * 100;
  const expectedEmail = payment.user.email?.trim().toLowerCase();
  const receivedEmail = verified.customer?.email?.trim().toLowerCase();
  const matches = verified.status === "success"
    && verified.reference === payment.reference
    && verified.amount === expectedAmount
    && payment.currency === PAYSTACK_CURRENCY
    && verified.currency === payment.currency
    && (!receivedEmail || receivedEmail === expectedEmail);

  if (!matches) {
    await prisma.premiumPayment.update({
      where: { id: payment.id },
      data: {
        status: verified.status === "abandoned" ? PremiumPaymentStatus.ABANDONED : PremiumPaymentStatus.FAILED,
        failureReason: "Paystack verification did not match the pending payment.",
      },
    });
    throw new Error("Payment verification failed. Premium access was not activated.");
  }

  const now = new Date();
  const claim = await prisma.$transaction(async (tx) => {
    const latestUser = await tx.user.findUnique({
      where: { id: payment.userId },
      select: { premiumExpiry: true },
    });
    const startsAt = latestUser?.premiumExpiry && latestUser.premiumExpiry > now ? latestUser.premiumExpiry : now;
    const expiresAt = getPremiumExpiry(startsAt);
    const claimed = await tx.premiumPayment.updateMany({
      where: { id: payment.id, status: { not: PremiumPaymentStatus.SUCCESS } },
      data: {
        status: PremiumPaymentStatus.SUCCESS,
        providerTransactionId: String(verified.id),
        paidAt: verified.paid_at ? new Date(verified.paid_at) : now,
        failureReason: null,
      },
    });
    if (claimed.count === 0) return { activated: false, expiresAt: latestUser?.premiumExpiry || null };

    await tx.user.update({
      where: { id: payment.userId },
      data: { isPremium: true, premiumPlan: payment.plan, premiumSince: now, premiumExpiry: expiresAt },
    });
    return { activated: true, expiresAt };
  }, { isolationLevel: "Serializable" });

  if (claim.activated) {
    try {
      await createNotification(
        payment.userId,
        NotificationType.PREMIUM_PAYMENT_CONFIRMED,
        "Premium payment confirmed",
        `Your annual ${payment.plan === "CORP_PREMIUM" ? "Corp Member" : "Agent"} Premium payment was confirmed. Premium access is active until ${claim.expiresAt.toLocaleDateString("en-NG")}.`,
        payment.plan === "CORP_PREMIUM" ? "/member/premium" : "/agent/premium",
        { dedupeKey: `premium-payment:paystack:${payment.reference}` },
      );
    } catch (error) {
      console.error("Paystack premium notification failed:", error);
    }
  }

  return { success: true, alreadyProcessed: !claim.activated, plan: payment.plan, role: payment.user.role, expiresAt: claim.expiresAt?.toISOString() || null } as const;
}
