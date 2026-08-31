import assert from "node:assert/strict";
import path from "node:path";
import { isAllowedCallbackPath, resolveSafeCallbackPath, resolveSafeCallbackUrl } from "../src/lib/safeRedirect.ts";
import { isPrivateIpAddress, validateOutboundUrl } from "../src/lib/safeOutboundFetch.ts";
import { parseVerificationStorageKey, resolvePrivateUploadPath } from "../src/lib/safeFileStorage.ts";

const baseUrl = "https://nysc-mu.vercel.app";

assert.equal(isAllowedCallbackPath("/member"), true);
assert.equal(isAllowedCallbackPath("/member/history"), true);
assert.equal(isAllowedCallbackPath("/evil"), false);
assert.equal(resolveSafeCallbackPath("/member?tab=history", baseUrl), "/member?tab=history");
assert.equal(resolveSafeCallbackPath("//evil.example/member", baseUrl), null);
assert.equal(resolveSafeCallbackPath("https://evil.example/member", baseUrl), null);
assert.equal(resolveSafeCallbackPath("/%2f%2fevil.example", baseUrl), null);
assert.equal(resolveSafeCallbackUrl("https://evil.example/", baseUrl), baseUrl);
assert.equal(resolveSafeCallbackUrl("/admin", baseUrl), `${baseUrl}/admin`);

for (const ip of ["127.0.0.1", "10.0.0.1", "172.16.0.1", "192.168.1.1", "169.254.1.1", "::1", "fd00::1", "fe80::1"]) {
  assert.equal(isPrivateIpAddress(ip), true, `private address must be rejected: ${ip}`);
}
assert.equal(isPrivateIpAddress("8.8.8.8"), false);
assert.throws(() => validateOutboundUrl("http://example.com"));
assert.throws(() => validateOutboundUrl("https://127.0.0.1/health"));
assert.throws(() => validateOutboundUrl("https://example.com\\@127.0.0.1/"));
assert.throws(() => validateOutboundUrl("https://example.com/", { allowedHosts: ["api.cloudinary.com"] }));
assert.equal(validateOutboundUrl("https://api.cloudinary.com/v1_1/demo/image/upload", { allowedHosts: ["api.cloudinary.com"] }).hostname, "api.cloudinary.com");

const validLocalKey = "local/0123456789abcdef0123456789abcdef.jpg";
const validBlobKey = "verification-documents/0123456789abcdef0123456789abcdef.webp";
assert.equal(parseVerificationStorageKey(validLocalKey)?.kind, "local");
assert.equal(parseVerificationStorageKey(validBlobKey)?.kind, "blob");
for (const key of ["local/../secret.txt", "local//etc/passwd", "/absolute.jpg", "local/0123456789abcdef0123456789abcdef.svg", "verification-documents/../../secret.jpg"]) {
  assert.equal(parseVerificationStorageKey(key), null, `unsafe storage key must be rejected: ${key}`);
}
const safeBase = path.join("/tmp", "nysc-private-uploads");
assert.equal(resolvePrivateUploadPath(safeBase, validLocalKey), path.join(safeBase, "0123456789abcdef0123456789abcdef.jpg"));
assert.equal(resolvePrivateUploadPath(safeBase, validBlobKey), null);

console.log(JSON.stringify({
  ok: true,
  checks: [
    "same-origin callback allowlist",
    "protocol-relative and external redirect rejection",
    "encoded redirect rejection",
    "private and loopback IP rejection",
    "outbound scheme and host allowlist",
    "verification storage-key allowlist",
    "canonical private-upload path confinement",
  ],
}, null, 2));
