import { NextResponse } from "next/server";
import { deliverPendingNotifications } from "../../../../lib/notificationService";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret) {
    return new NextResponse("Cron endpoint is not configured", { status: 503 });
  }
  if (authorization !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await deliverPendingNotifications();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Notification delivery cron failed:", error);
    return NextResponse.json({ error: "Failed to deliver notifications" }, { status: 500 });
  }
}
