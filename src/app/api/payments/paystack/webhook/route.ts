import { NextResponse } from "next/server";
import { writeSystemAuditLog } from "../../../../../lib/audit";
import {
  isPaystackConfigured,
  verifyAndActivatePaystackPayment,
  verifyPaystackWebhookSignature,
} from "../../../../../lib/paystack";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isPaystackConfigured()) {
    return NextResponse.json({ error: "Paystack webhook is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  if (!verifyPaystackWebhookSignature(rawBody, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: { event?: string; data?: { reference?: string } };
  try {
    payload = JSON.parse(rawBody) as { event?: string; data?: { reference?: string } };
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  if (payload.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const reference = payload.data?.reference?.trim() || "";
  if (!reference || !/^[A-Za-z0-9.=\-]{8,100}$/.test(reference)) {
    return NextResponse.json({ error: "Webhook payment reference is missing or invalid." }, { status: 400 });
  }

  try {
    const result = await verifyAndActivatePaystackPayment(reference);
    try {
      await writeSystemAuditLog(
        "PREMIUM_PAYSTACK_WEBHOOK_PROCESSED",
        reference,
        `Paystack charge.success processed; alreadyProcessed=${result.alreadyProcessed}`,
      );
    } catch (error) {
      console.error("Paystack webhook audit failed:", error);
    }
    return NextResponse.json({ received: true, processed: true, alreadyProcessed: result.alreadyProcessed });
  } catch (error) {
    console.error("Paystack webhook processing failed:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
