import { NextResponse } from "next/server";
import { createRentDueReminders } from "../../../../lib/rentDueReminders";

function isVercelCron(request: Request) { return request.headers.get("user-agent")?.includes("vercel-cron/1.0") === true; }
async function run(request: Request) { const secret = process.env.CRON_SECRET; if (!secret) return new NextResponse("Cron endpoint is not configured", { status: 503 }); if (request.headers.get("authorization") !== `Bearer ${secret}`) return new NextResponse("Unauthorized", { status: 401 }); if (request.method === "GET" && !isVercelCron(request)) return new NextResponse("Use POST for manual cron execution", { status: 405, headers: { Allow: "POST" } }); try { return NextResponse.json(await createRentDueReminders(), { headers: { "Cache-Control": "no-store" } }); } catch (error) { console.error("Rent due reminder cron failed:", error); return NextResponse.json({ error: "Failed to create rent due reminders" }, { status: 500 }); } }
export function GET(request: Request) { return run(request); }
export function POST(request: Request) { return run(request); }
