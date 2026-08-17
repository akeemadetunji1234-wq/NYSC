# Chat, Routing, and Deployment Log Audit Addendum

**Application:** Neat & Affordable  
**Deployment:** `dpl_G2fedhKRFMjrxqKL9tEAH7KvJEUn`  
**Commit:** `bf235a2`  
**Live URL:** https://nysc-mu.vercel.app

## Findings

### Mapbox offline and fallback handling

`CommuteMap.tsx` now wraps each routing request in a ten-second `AbortController` timeout and checks HTTP status before parsing JSON. Mapbox is attempted first. If Mapbox fails because of an offline browser, timeout, non-2xx response, malformed response, or no usable route, OSRM is attempted independently. If both services fail, the component keeps the Lodge and PPA markers visible and displays: “Street directions are temporarily unavailable. The map markers are still shown.” It does not draw a straight-line route in the failure case.

The remaining minor improvement would be to add an explicit `navigator.onLine` indicator and an unmount guard for asynchronous state updates. Neither issue currently prevents graceful degradation.

### Vercel runtime and build observations

The latest production deployment is READY and serves `nysc-mu.vercel.app`. Health checks returned HTTP 200 with `{"status":"ok"}`, and sign-in returned HTTP 200. The local production build for the deployed source compiled successfully, including TypeScript checking and static-page generation.

The only recurring production configuration issue is `POST /api/pusher/auth` returning HTTP 503 with `{"error":"Realtime messaging is unavailable"}`. This indicates that the server-side Pusher configuration is still incomplete in Vercel Production. The required values are `PUSHER_APP_ID`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_KEY`, and `NEXT_PUBLIC_PUSHER_CLUSTER`. The Pusher auth route must be tested with POST, not GET; GET correctly returns 405.

The recent runtime log sample contained no new fatal application error on the latest deployment. The historical error sample contained one stale-chat-gate error from an older deployment and one Node.js dependency warning involving `url.parse()` during Google authentication. The `punycode` deprecation warnings observed during the local build originated from dependencies and did not fail the build.

### Live chat test status

The live browser session was not observed on the Corp Member Messages page. It reached an Admin Portal session during one sign-in attempt, and subsequent direct navigation to `/member/messages` redirected to `/signin`. Therefore, an end-to-end message send and Pusher delivery test could not be truthfully marked as passed. The code-level chat gate has been removed in commit `bf235a2`, but production real-time delivery remains unverified until a valid Corp Member session is active and Pusher variables are configured.

## Recommended next actions

1. Add and redeploy the four Pusher variables in Vercel Production.
2. Sign in as a Corp Member and open `/member/messages`.
3. Send a short test message to a valid Agent recipient and confirm the message appears in the database-backed conversation.
4. Confirm `/api/pusher/auth` returns an authenticated response rather than 503 and observe the `new-message` event in both connected sessions.
5. Optionally add `navigator.onLine` UI state and an abort/unmount guard to CommuteMap for further polish.
