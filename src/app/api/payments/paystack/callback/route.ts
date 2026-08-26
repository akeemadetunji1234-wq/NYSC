import { NextResponse } from "next/server";
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
  const reference = url.searchParams.get("reference")?.trim() || "";
  if (!reference || !/^[A-Za-z0-9.=\-]{8,100}$/.test(reference)) {
    return redirectToPremium(request, "/signin", "failed");
  }

  try {
    const result = await verifyAndActivatePaystackPayment(reference);
    const destination = result.role === "AGENT" ? "/agent/premium" : "/member/premium";
    return redirectToPremium(request, destination, "success", reference);
  } catch (error) {
    console.error("Paystack callback verification failed:", error);
    return redirectToPremium(request, "/signin", "failed", reference);
  }
}
