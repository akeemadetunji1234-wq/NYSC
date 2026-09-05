import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { verifyAndActivatePaystackPayment } from "../../../../../lib/paystack";

export const dynamic = "force-dynamic";

function redirectToPremium(request: Request, path: string, status: "success" | "failed", reference?: string) {
  const url = new URL(path, request.url);
  url.searchParams.set("payment", status);
  if (reference) url.searchParams.set("reference", reference);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  // Paystack normally sends `reference`; retain `trxref` compatibility for hosted checkout redirects.
  const reference = (url.searchParams.get("reference") || url.searchParams.get("trxref"))?.trim() || "";
  if (!reference || !/^[A-Za-z0-9.=\-]{8,100}$/.test(reference)) {
    return redirectToPremium(request, "/signin", "failed");
  }

  // Resolve the destination from our own payment record, never from a client-supplied role.
  const payment = await prisma.premiumPayment.findUnique({
    where: { reference },
    select: { plan: true },
  });
  const destination = payment?.plan === "AGENT_PREMIUM" ? "/agent/premium" : "/member/premium";

  try {
    const result = await verifyAndActivatePaystackPayment(reference);
    const verifiedDestination = result.role === "AGENT" ? "/agent/premium" : "/member/premium";
    return redirectToPremium(request, verifiedDestination, "success", reference);
  } catch (error) {
    console.error("Paystack callback verification failed:", error);
    return redirectToPremium(request, destination, "failed", reference);
  }
}
