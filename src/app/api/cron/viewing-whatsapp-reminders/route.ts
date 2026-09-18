import { NextResponse } from "next/server";
import { sendUpcomingViewingWhatsAppReminders } from "../../../../lib/whatsappReminderService";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const isVercelCron = request.headers.get("user-agent")?.includes("vercel-cron/1.0") === true;
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}` && (request.method === "POST" || isVercelCron));
}

async function run(request: Request) {
  if (!authorized(request)) return new NextResponse("Unauthorized", { status: 401 });
  try {
    return NextResponse.json(await sendUpcomingViewingWhatsAppReminders(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Viewing WhatsApp reminder cron failed", error);
    return NextResponse.json({ error: "Failed to send viewing reminders" }, { status: 500 });
  }
}

export function POST(request: Request) { return run(request); }

export function GET(request: Request) { return run(request); }
