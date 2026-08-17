# Nearby Essentials Provider Merge Fix

**Date:** 2026-08-17
**Affected route:** `/api/nearby-essentials`
**Branch:** `staging/nysc-hardening-auth-e2e`

## Reproduction

Read-only probes against the live API returned HTTP 200 for all requests, but Hospitals & Clinics and Banks & ATMs returned empty arrays at representative coordinates in Ibadan. Abuja returned hospital results but no bank results, while Lagos returned bank results but no hospital results. This confirms that the endpoint was healthy but category coverage was inconsistent.

## Root Cause

The server queried two Overpass mirrors in parallel but selected only the first response containing an `elements` array. An empty `elements` array is still a successful response, so a mirror that returned no records could mask real records returned by the other mirror.

## Fix

The route now merges every successful mirror response and leaves the existing distance filter and name/coordinate deduplication to produce the final result set. This does not fabricate locations or add out-of-radius fallback records.

## Validation

The focused TypeScript check passed. The Next.js build compiled successfully and completed TypeScript before the local page-data phase stalled on the unavailable local database environment. The final production verification must be performed after the staging/production deployment.

## Staging Preview Smoke Test

**Preview URL:** `https://nysc-5c9qdrixa-akeemadetunji1234-wqs-projects.vercel.app`

The preview deployment for commit `f4f98ec` was READY and the Hospitals endpoint returned HTTP 200 with `{"places":[],"radiusKm":30}` for the Abuja probe coordinate. This shows the endpoint and deployment are healthy, but the provider data still did not produce a named hospital for that particular coordinate. The second bank probe was issued separately and must be read before deciding whether the code fix is sufficient. No place was fabricated.

## Production verification after Nominatim fallback

Commit `f98b083` was promoted from `staging/nysc-hardening-auth-e2e` to `main` after the staging preview returned real named results. Vercel Production deployment `dpl_7dTCCQHJ7vmRfbsWHJHHjpqhKS22` reached `READY`.

A read-only Production smoke test at representative Ibadan coordinates returned HTTP 200 with 25 Hospitals & Clinics and 25 Banks & ATMs. The first hospital samples were Agugu Community Health Centre, Oke'badan Community Health And Maternity Centre, and Ibadan Central Hospital; the first bank samples were First Bank, First Bank PLC, and Skye Bank. All reported distances were within the 30 km server radius and the source was OpenStreetMap.

The original zero-result behavior was caused by sparse or empty Overpass/Mapbox responses for healthcare and banking categories, compounded by provider results being merged too narrowly. The fix now merges successful Overpass mirrors and adds a bounded Nominatim OpenStreetMap fallback for hospitals, banks, bus stations, and police stations. No fabricated or city-wide fallback records were added.
