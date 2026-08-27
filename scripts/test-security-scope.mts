import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { POST as registerPost } from "../src/app/api/auth/register/route";
import { consumeEmailVerificationToken, consumeGoogleOnboardingState, createEmailVerificationToken, createGoogleOnboardingState, hashEmailVerificationToken } from "../src/lib/emailVerification";
import { getSessionCookieConfig } from "../src/lib/authCookiePolicy";
import { resolveSafeCallbackUrl } from "../src/lib/authSecurity";
import { corsPolicy, corsResponseHeaders } from "../src/lib/security";
import { isPrivateIpAddress, validateOutboundUrl } from "../src/lib/safeOutboundFetch";

const prisma = new PrismaClient();
const runId = Date.now().toString();
const verificationEmails: string[] = [];
const googleStateHashes: string[] = [];

try {
  const now = new Date();
  const email = `security-verification-${runId}@example.test`;
  verificationEmails.push(email);
  const emailToken = createEmailVerificationToken(now);
  assert.equal(emailToken.rawToken.length, 64, "verification token must have 256 bits of entropy");
  assert.notEqual(emailToken.rawToken, emailToken.tokenHash, "only the hash is stored");
  assert.equal(hashEmailVerificationToken(emailToken.rawToken), emailToken.tokenHash);
  await prisma.emailOtp.create({ data: { email, codeHash: "test-code-hash", verificationTokenHash: emailToken.tokenHash, expiresAt: emailToken.expiresAt } });
  const consumedEmail = await prisma.$transaction((tx) => consumeEmailVerificationToken(tx, emailToken.rawToken, now));
  assert.deepEqual(consumedEmail, { email }, "verification token must resolve to its bound address");
  assert.equal(await prisma.$transaction((tx) => consumeEmailVerificationToken(tx, emailToken.rawToken, now)), null, "verification token reuse must fail");

  const expiredEmail = `security-expired-${runId}@example.test`;
  verificationEmails.push(expiredEmail);
  const expiredToken = createEmailVerificationToken(new Date(now.getTime() - 11 * 60 * 1000));
  await prisma.emailOtp.create({ data: { email: expiredEmail, codeHash: "test-code-hash", verificationTokenHash: expiredToken.tokenHash, expiresAt: expiredToken.expiresAt } });
  assert.equal(await prisma.$transaction((tx) => consumeEmailVerificationToken(tx, expiredToken.rawToken, now)), null, "expired verification token must fail");

  const tamperEmail = `security-tamper-${runId}@example.test`;
  verificationEmails.push(tamperEmail);
  await prisma.emailOtp.create({ data: { email: tamperEmail, codeHash: "test-code-hash", expiresAt: new Date(now.getTime() + 10 * 60 * 1000) } });
  const tamperResponse = await registerPost(new Request("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Synthetic User", email: tamperEmail, password: "SyntheticPassword123!", role: "CORP", verified: true }),
  }));
  assert.equal(tamperResponse.status, 403, "client verified flags must not grant registration");

  const googleEmail = `security-google-${runId}@example.test`;
  verificationEmails.push(googleEmail);
  const googleState = createGoogleOnboardingState(now);
  googleStateHashes.push(googleState.tokenHash);
  await prisma.googleOnboardingState.create({ data: { tokenHash: googleState.tokenHash, email: googleEmail, name: "Trusted Google Name", expiresAt: googleState.expiresAt } });
  const consumedState = await prisma.$transaction((tx) => consumeGoogleOnboardingState(tx, googleState.rawToken, now));
  assert.deepEqual(consumedState, { email: googleEmail, name: "Trusted Google Name" }, "Google state must resolve to stored identity");
  assert.equal(await prisma.$transaction((tx) => consumeGoogleOnboardingState(tx, googleState.rawToken, now)), null, "Google onboarding state reuse must fail");

  const secureCookie = getSessionCookieConfig(true);
  assert.equal(secureCookie.name, "__Secure-next-auth.session-token");
  assert.deepEqual(secureCookie.options, { httpOnly: true, sameSite: "lax", secure: true, path: "/" });
  assert.equal("domain" in secureCookie.options, false, "session cookie must remain host-only");
  const localCookie = getSessionCookieConfig(false);
  assert.equal(localCookie.name, "next-auth.session-token");
  assert.equal(localCookie.options.secure, false, "local HTTP tests must not assert Secure cookies");

  const sameOriginRequest = new Request("https://nysc-mu.vercel.app/api/test", { headers: { origin: "https://nysc-mu.vercel.app" } });
  assert.deepEqual(corsPolicy(sameOriginRequest, "/api/test"), { allowed: true, crossOrigin: false, origin: "https://nysc-mu.vercel.app" });
  const hostileOriginRequest = new Request("https://nysc-mu.vercel.app/api/test", { headers: { origin: "https://evil.example" } });
  assert.equal(corsPolicy(hostileOriginRequest, "/api/test").allowed, false, "untrusted origins must be rejected");
  assert.equal(corsResponseHeaders(hostileOriginRequest, "/api/test"), undefined, "untrusted origins must not receive reflected CORS headers");

  const baseUrl = "https://nysc-mu.vercel.app";
  assert.equal(resolveSafeCallbackUrl("//evil.example/phish", baseUrl), baseUrl);
  assert.equal(resolveSafeCallbackUrl("https://evil.example/phish", baseUrl), baseUrl);
  assert.equal(resolveSafeCallbackUrl("/%2f%2fevil.example", baseUrl), baseUrl);
  assert.equal(resolveSafeCallbackUrl("javascript:alert(1)", baseUrl), baseUrl);
  assert.equal(resolveSafeCallbackUrl("/member/history", baseUrl), `${baseUrl}/member/history`);

  for (const candidate of [
    "http://127.0.0.1/admin",
    "https://127.0.0.1/admin",
    "https://[::1]/admin",
    "https://169.254.169.254/latest/meta-data",
    "https://metadata.google.internal/computeMetadata/v1",
    "https://localhost/internal",
    "//127.0.0.1/internal",
    "https://evil.example\\@127.0.0.1/internal",
  ]) {
    assert.throws(() => validateOutboundUrl(candidate), `SSRF candidate must be rejected: ${candidate}`);
  }
  assert.equal(isPrivateIpAddress("10.0.0.1"), true);
  assert.equal(isPrivateIpAddress("172.16.0.1"), true);
  assert.equal(isPrivateIpAddress("192.168.1.1"), true);
  assert.equal(isPrivateIpAddress("::1"), true);
  assert.equal(isPrivateIpAddress("fc00::1"), true);
  assert.equal(isPrivateIpAddress("8.8.8.8"), false);
  assert.equal(validateOutboundUrl("https://api.paystack.co/transaction/initialize", { allowedHosts: ["api.paystack.co"] }).hostname, "api.paystack.co");
  assert.throws(() => validateOutboundUrl("https://evil.example/", { allowedHosts: ["api.paystack.co"] }));

  console.log(JSON.stringify({ ok: true, checks: ["email-token-entropy", "email-token-expiry", "email-token-single-use", "client-flag-tampering", "google-state-binding", "google-state-single-use", "secure-cookie-policy", "cors-origin-deny", "redirect-encoding-bypass", "ssrf-private-addresses", "ssrf-host-allowlist"] }, null, 2));
} finally {
  await prisma.emailOtp.deleteMany({ where: { email: { in: verificationEmails } } }).catch(() => undefined);
  if (googleStateHashes.length) await prisma.googleOnboardingState.deleteMany({ where: { tokenHash: { in: googleStateHashes } } }).catch(() => undefined);
  await prisma.$disconnect();
}
