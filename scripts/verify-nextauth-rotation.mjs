import assert from "node:assert/strict";
import { encode } from "next-auth/jwt";

const baseUrl = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const oldSecret = process.env.OLD_HISTORICAL_NEXTAUTH_SECRET || "";
if (!oldSecret) throw new Error("OLD_HISTORICAL_NEXTAUTH_SECRET is required in the process environment only.");
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(baseUrl)) throw new Error("Rotation verification is local-only.");

const token = await encode({
  secret: oldSecret,
  token: {
    name: "Historical Rotation Probe",
    email: "historical-rotation-probe@example.test",
    sub: "historical-rotation-probe",
    id: "historical-rotation-probe",
    role: "CORP",
    sessionVersion: 0,
  },
});
const response = await fetch(`${baseUrl}/api/auth/session`, {
  headers: { cookie: `next-auth.session-token=${token}` },
});
assert.equal(response.status, 200, "session endpoint should respond after rotation");
const body = await response.json();
assert.ok(!body.user, "a token signed with the historical secret must not authenticate after rotation");
console.log(JSON.stringify({ ok: true, old_secret_token_rejected: true, session_user_present: false }, null, 2));
