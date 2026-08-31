import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import middleware from "../middleware";

const hostileApiRequest = new NextRequest("https://nysc-mu.vercel.app/api/test", {
  headers: { origin: "https://evil.example" },
});
const hostileResponse = await middleware(hostileApiRequest);
assert.equal(hostileResponse.status, 403);
assert.equal(hostileResponse.headers.get("access-control-allow-origin"), null);
assert.equal(hostileResponse.headers.get("x-frame-options"), "DENY");
assert.equal(hostileResponse.headers.get("strict-transport-security"), "max-age=31536000; includeSubDomains");
const hostileCsp = hostileResponse.headers.get("content-security-policy") || "";
assert.match(hostileCsp, /default-src 'self'/);
assert.match(hostileCsp, /script-src [^;]*'nonce-/);
assert.match(hostileCsp, /frame-ancestors 'none'/);
assert.match(hostileCsp, /object-src 'none'/);
assert.match(hostileCsp, /style-src [^;]*'nonce-/);
assert.match(hostileCsp, /img-src /);
assert.match(hostileCsp, /connect-src /);
assert.match(hostileCsp, /base-uri 'self'/);
assert.doesNotMatch(hostileCsp, /unsafe-eval/);
assert.doesNotMatch(hostileCsp, /style-src [^;]*unsafe-inline/);

const sameOriginPageRequest = new NextRequest("https://nysc-mu.vercel.app/signin", {
  headers: { origin: "https://nysc-mu.vercel.app" },
});
const sameOriginResponse = await middleware(sameOriginPageRequest);
assert.equal(sameOriginResponse.headers.get("access-control-allow-origin"), null);

console.log(JSON.stringify({ ok: true, checks: ["hostile-origin-denied", "no-origin-reflection", "csp-nonce", "csp-framing", "no-unsafe-eval", "no-style-unsafe-inline", "explicit-resource-directives", "x-frame-options", "hsts"] }, null, 2));
