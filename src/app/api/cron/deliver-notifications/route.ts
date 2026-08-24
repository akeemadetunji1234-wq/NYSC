import { NextResponse } from "next/server";
import { deliverPendingNotifications } from "../../../../lib/notificationService";

function isVercelCron(request: Request) {
  return request.headers.get("user-agent")?.includes("vercel-cron/1.0") === true;
}

async function runDelivery(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!cronSecret) return new NextResponse("Cron endpoint is not configured", { status: 503 });
  if (authorization !== `Bearer ${cronSecret}`) return new NextResponse("Unauthorized", { status: 401 });
  if (request.method === "GET" && !isVercelCron(request)) {
    return new NextResponse("Use POST for manual cron execution", { status: 405, headers: { Allow: "POST" } });
  }

  try {
    const result = await deliverPendingNotifications();
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Notification delivery cron failed:", error);
    return NextResponse.json({ error: "Failed to deliver notifications" }, { status: 500 });
  }
}

export function GET(request: Request) {
  return runDelivery(request);
}

export function POST(request: Request) {
  return runDelivery(request);
}
