import { NextResponse } from "next/server";
import { getWebPushPublicKey } from "../../../../lib/webPush";

export function GET() {
  const publicKey = getWebPushPublicKey();
  if (!publicKey) return NextResponse.json({ enabled: false }, { headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ enabled: true, publicKey }, { headers: { "Cache-Control": "no-store" } });
}
