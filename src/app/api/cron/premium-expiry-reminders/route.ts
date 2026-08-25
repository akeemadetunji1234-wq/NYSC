import { NextResponse } from "next/server";
import { createPremiumExpiryReminders } from "../../../../lib/premiumExpiryReminders";

function isVercelCron(request: Request) {
  return request.headers.get("user-agent")?.includes("vercel-cron/1.0") === true;
}

async function runReminders(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!cronSecret) return new NextResponse("Cron endpoint is not configured", { status: 503 });
  if (authorization !== `Bearer ${cronSecret}`) return new NextResponse("Unauthorized", { status: 401 });
  if (request.method === "GET" && !isVercelCron(request)) {
    return new NextResponse("Use POST for manual cron execution", { status: 405, headers: { Allow: "POST" } });
  }

  try {
    const result = await createPremiumExpiryReminders();
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Premium expiry reminder cron failed:", error);
    return NextResponse.json({ error: "Failed to create premium expiry reminders" }, { status: 500 });
  }
}

export function GET(request: Request) {
  return runReminders(request);
}

export function POST(request: Request) {
  return runReminders(request);
}
