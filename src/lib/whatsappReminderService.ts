import { prisma } from "./prisma";

type ReminderResult = { configured: boolean; attempted: number; sent: number; skipped: number; failed: number };

function config() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME?.trim();
  const language = process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() || "en_US";
  return accessToken && phoneNumberId && templateName ? { accessToken, phoneNumberId, templateName, language } : null;
}

function normalizeNigeriaPhone(phone: string | null | undefined) {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length >= 13) return digits;
  if (digits.startsWith("0") && digits.length === 11) return `234${digits.slice(1)}`;
  return null;
}

async function sendTemplate(to: string, body: string[]) {
  const settings = config();
  if (!settings) return false;
  const version = process.env.WHATSAPP_CLOUD_API_VERSION?.trim() || "v23.0";
  const response = await fetch(`https://graph.facebook.com/${version}/${settings.phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${settings.accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "template", template: { name: settings.templateName, language: { code: settings.language }, components: [{ type: "body", parameters: body.map((text) => ({ type: "text", text })) }] } }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`WhatsApp Cloud API returned ${response.status}`);
  return true;
}

export async function sendUpcomingViewingWhatsAppReminders(): Promise<ReminderResult> {
  const settings = config();
  if (!settings) return { configured: false, attempted: 0, sent: 0, skipped: 0, failed: 0 };
  const now = new Date();
  const until = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const viewings = await prisma.viewing.findMany({
    where: { status: "PENDING", date: { gte: now, lte: until }, whatsappReminderSentAt: null },
    select: { id: true, date: true, time: true, property: { select: { title: true, agent: { select: { name: true, whatsapp: true, whatsappOptIn: true } } } } },
    take: 100,
    orderBy: { date: "asc" },
  });
  const result: ReminderResult = { configured: true, attempted: viewings.length, sent: 0, skipped: 0, failed: 0 };
  for (const viewing of viewings) {
    const to = viewing.property.agent.whatsappOptIn ? normalizeNigeriaPhone(viewing.property.agent.whatsapp) : null;
    if (!to) { result.skipped += 1; continue; }
    try {
      await sendTemplate(to, [viewing.property.agent.name || "Agent", viewing.property.title, viewing.date.toLocaleDateString("en-NG"), viewing.time]);
      await prisma.viewing.updateMany({ where: { id: viewing.id, whatsappReminderSentAt: null }, data: { whatsappReminderSentAt: new Date() } });
      result.sent += 1;
    } catch (error) {
      result.failed += 1;
      console.error("WhatsApp viewing reminder failed", { viewingId: viewing.id, error });
    }
  }
  return result;
}
