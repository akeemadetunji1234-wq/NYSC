# Security Path Hardening Audit — 2026-08-29

**Application:** Neat & Affordable / NYSC marketplace  
**Scope:** CSP and framing, redirect destinations, server-side URL fetches, filesystem paths, dynamic file selection, and uploads.

## Summary

The audit found that the application already had strong baseline controls for same-origin API access, nonce-bearing CSP generation, HSTS, anti-framing, SSRF-safe provider calls, image signature checks, upload limits, server-generated verification-document names, and private storage. This pass tightened the remaining concrete gaps without changing the marketplace’s intended behavior.

| Area | Status | Change or evidence |
|---|---|---|
| CSP | Hardened | Removed `unsafe-inline` from `style-src`; retained per-response nonce, explicit directives, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, and explicit provider origins. |
| Anti-framing | Pass | Middleware and Next config emit `frame-ancestors 'none'` and `X-Frame-Options: DENY`. No legitimate embedding requirement was identified. |
| Redirects | Hardened | Added shared `safeRedirect.ts`; server and sign-in browser flow now use exact same-origin approved paths and reject external/protocol-relative/encoded bypasses. |
| SSRF | Pass with regression coverage | Existing `safeOutboundFetch` enforces HTTPS, host allowlists, private-IP rejection, DNS checks, bounded redirects, timeouts, and response limits. Provider call sites use it. |
| Filesystem paths | Hardened | Added `safeFileStorage.ts`; admin document retrieval now accepts only canonical local or approved private Blob storage keys and confines local paths under `.private-uploads`. |
| Dynamic file selection | Pass | No user-controlled dynamic module/template loading was found. Approved storage keys are fixed by regex and mapped to known file types. |
| Verification-document uploads | Pass | Existing route uses image MIME allowlist, magic-byte checks, generated filenames, size limits, private storage, and safe content headers on retrieval. |
| Cloudinary listing uploads | Hardened | Server now generates the filename/public ID, forwards validated bytes rather than the client filename, enforces the Cloudinary response origin, and retains per-user/IP/batch limits. |

## CSP and framing

`middleware.ts` creates a fresh nonce per request using the Web Crypto API and places it in both the request headers and CSP. The policy explicitly declares `default-src`, `base-uri`, `object-src`, `frame-ancestors`, `form-action`, `script-src`, `style-src`, `img-src`, `font-src`, `connect-src`, `frame-src`, `worker-src`, `manifest-src`, and `upgrade-insecure-requests`. `X-Frame-Options: DENY` is also emitted by middleware and `next.config.mjs` for legacy user agents.

The one inline React style attribute found in `MapPicker.tsx` was replaced with a Tailwind class, allowing `style-src` to use the nonce without `unsafe-inline`. The Mapbox marker uses a DOM `style.cssText` assignment; this is runtime element styling rather than a user-controlled HTML sink. If browser compatibility testing shows CSP style-attribute violations for that marker, replace it with a CSS class in the stylesheet rather than weakening the policy.

## Redirect audit

The server-side NextAuth redirect callback already delegated to the central validator. The validator is now in `src/lib/safeRedirect.ts` and is shared with the browser sign-in flow. Approved destinations are `/`, `/member`, `/agent`, `/admin`, and descendants. Same-origin query strings and fragments remain supported. External origins, protocol-relative URLs, malformed values, unapproved paths, and encoded slash bypass attempts resolve to a safe fallback or are ignored.

Paystack callback redirects and WhatsApp contact redirects were reviewed as intentional fixed/server-derived destinations. They do not accept arbitrary browser redirect targets. Client-side fetches to application-relative API paths are not server-side SSRF surfaces.

## SSRF and outbound fetch audit

`src/lib/safeOutboundFetch.ts` validates HTTPS, rejects credentials and non-443 ports, rejects localhost/internal names and private, loopback, link-local, multicast, and reserved IP ranges, validates DNS resolution, disables automatic redirects, revalidates redirect targets, limits redirects, sets a timeout, and bounds response size. Nearby-essentials and Cloudinary provider calls use explicit host allowlists.

The maintenance migration script `scripts/migrate-public-documents.cjs` remains a separately bounded path: it requires HTTPS without credentials or a port, resolves DNS, rejects private addresses, disables redirects, enforces a five-second timeout, and caps the response at 5 MB. It is guarded against production execution unless `ALLOW_PUBLIC_DOCUMENT_MIGRATION=true` is explicitly set. The city-coverage script fetches only its configured application base URL and is a maintenance check, not a user-controlled server fetch.

## Filesystem and dynamic selection audit

The only maintained filesystem reads/writes are verification-document storage and administrative retrieval, plus static maintenance scripts. Verification uploads receive a 32-byte random filename-derived key and are stored in Vercel Blob private storage or `.private-uploads`. The new storage helper accepts only `local/<32 hex>.(jpg|png|webp)` and `verification-documents/<32 hex>.(jpg|png|webp)`. The final local path is canonicalized and checked to remain below the approved base directory. Arbitrary absolute paths, traversal, configuration files, executable extensions, and arbitrary Blob keys are rejected.

Dynamic imports are fixed application component imports used for client-only maps. No user-controlled module, template, or file include was found.

## Upload audit

The verification-document endpoint permits only JPEG, PNG, and WebP, checks both client MIME and file signatures, caps each file at 5 MB, rate limits signed-in and preregistration flows, generates a random server-side name, and uses private storage. The administrative response uses a safe content type, inline disposition, private no-store caching, and `nosniff`.

The Cloudinary listing-image endpoint permits only JPEG, PNG, and WebP, checks signatures, caps files at 10 MB and batches at five, applies per-user/IP/batch abuse limits, and uses an SSRF-safe HTTPS call to `api.cloudinary.com`. It now generates a random server-side filename and `listing-images/<random-id>` public ID, so client filenames cannot influence Cloudinary storage names. The returned URL must be HTTPS, use the exact `res.cloudinary.com` host, and contain the configured cloud name.

Malware scanning is not installed. Because uploads are restricted to listing images and verification documents and are stored outside executable application paths, this remains a risk-based residual item. Add provider or dedicated malware scanning before accepting higher-risk document types or broad user-generated files.

## Regression validation

The following checks passed locally:

```text
node --experimental-strip-types scripts/test-security-file-redirect-ssrf.mjs
CI=1 pnpm dlx --yes --package tsx tsx scripts/test-security-headers.ts
pnpm exec tsc --noEmit
python /home/ubuntu/skills/skill-creator/scripts/quick_validate.py nysc-security-audit
```

The new regression suite proves same-origin callback allowlisting, external/protocol-relative/encoded redirect rejection, private and loopback address rejection, outbound scheme and host restrictions, storage-key allowlisting, and canonical private-upload path confinement. The header suite proves CSP nonce presence, explicit resource directives, anti-framing, HSTS, no `unsafe-eval`, and no `style-src unsafe-inline`.

## Residual launch actions

Before publishing the next production build, review CSP violations in a controlled browser journey covering sign-in, Google onboarding, maps, image display, Cloudinary upload, and Paystack test-mode UI. Confirm that the configured Cloudinary unsigned upload preset accepts the server-generated `public_id`; if the preset rejects that field, create a signed server-side upload configuration rather than restoring client filenames.

Keep production write-flow tests isolated from real customer data and funds. Run the two-account authorization tests and upload-flow tests against the isolated test database or an explicitly approved staging deployment. Review Vercel Firewall analytics to confirm the `/api/auth/*` rule scope separately from the application-level controls.
