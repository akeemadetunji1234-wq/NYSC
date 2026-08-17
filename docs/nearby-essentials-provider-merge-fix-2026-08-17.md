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
