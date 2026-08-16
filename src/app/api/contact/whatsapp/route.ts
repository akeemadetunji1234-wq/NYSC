import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireRole } from "../../../../lib/authGuard";

function normalizeNigeriaWhatsAppNumber(value: string | null | undefined) {
  const digits = value?.replace(/\D/g, "") ?? "";
  if (!digits) return null;

  const international = digits.startsWith("0")
    ? `234${digits.slice(1)}`
    : digits.startsWith("234")
      ? digits
      : `234${digits}`;

  if (international.length < 12 || international.length > 15) return null;
  return international;
}

export async function GET(request: NextRequest) {
  try {
    await requireRole("CORP");

    const propertyId = request.nextUrl.searchParams.get("propertyId")?.trim();
    if (!propertyId || propertyId.length > 100) {
      return NextResponse.json({ error: "A valid propertyId is required." }, { status: 400 });
    }

    const property = await prisma.property.findFirst({
      where: { id: propertyId, status: "PUBLISHED" },
      select: {
        title: true,
        agent: { select: { name: true, whatsapp: true } },
      },
    });

    if (!property?.agent) {
      return NextResponse.json({ error: "Published property or agent not found." }, { status: 404 });
    }

    const phoneNumber = normalizeNigeriaWhatsAppNumber(property.agent.whatsapp);
    if (!phoneNumber) {
      return NextResponse.json({ error: "This agent has not added a valid WhatsApp number." }, { status: 404 });
    }

    const message = `Hello ${property.agent.name || "Agent"}, I’m interested in ${property.title} on Neat & Affordable.`;
    const whatsappUrl = new URL(`https://wa.me/${phoneNumber}`);
    whatsappUrl.searchParams.set("text", message);

    return NextResponse.redirect(whatsappUrl, 307);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status = message.startsWith("Forbidden") ? 403 : 401;
    return NextResponse.json({ error: status === 403 ? "Corp Member access required." : "Authentication required." }, { status });
  }
}
