import { NextResponse } from "next/server";

// NextAuth v4 sends logs to this endpoint in development.
// This stub prevents 404 errors that break CLIENT_FETCH_ERROR.
export async function POST() {
  return NextResponse.json({ ok: true });
}
