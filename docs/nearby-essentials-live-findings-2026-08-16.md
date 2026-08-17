# Nearby Essentials live verification — 2026-08-16

Authenticated Corp Member session opened Marketplace and requested browser location.

Observed selected location appears to be in Ibadan, with supermarket results:

- Source shown: Curated directory
- Ace Supermarket Bodija — Bodija Market Rd, Ibadan — 4.2 km
- FoodCo Supermarket Bodija — Bodija, Ibadan — 4.4 km
- Only 2 supermarket results rendered, despite the requested 10-result goal.
- Each result exposes a “Show in-app directions” button.
- The page initially showed “Choose a location to search nearby” until the location request was retried.

Likely issue to investigate: live provider results may be missing/filtered, while the curated directory contains only two nearby supermarket records for this location. Need verify other categories and inspect provider parsing/deduplication and result limit behavior.

## Additional live observations

The Restaurants tab returned zero results within 30 km, while the Supermarkets tab returned only two curated entries. The first result opened an embedded “Directions to Ace Supermarket Bodija” panel with “Loading street directions…”, confirming the route UI is in-app. The supermarket results were not populated by live provider results; the source label was “Curated directory”.

This indicates the immediate defect is likely provider coverage/transport rather than only the radius: OSM and Mapbox results are not reaching or surviving the client-side pipeline, while the curated fallback works. The live session is in Ibadan near Bodija according to the displayed real locations.

## Live validation after server-side provider fix

Production API tests used the stable alias at `nysc-mu.vercel.app` with an Ibadan-area origin of 7.44, 3.90 and the configured 30 km radius. The restaurant, supermarket, pharmacy, bank, and transport categories returned real OpenStreetMap records. Hospital and security queries were not consistently available: some requests returned an empty list because the Overpass provider timed out or was busy, while the earlier regional sample returned seven security records in Ibadan and hospitals returned records in Port Harcourt and Kano. This is a provider availability/coverage issue, not evidence that the distance filter is dropping all records.

Regional sample results for hospital/security: Ibadan hospital timed out and security returned 7; Lagos hospital and security timed out; Abuja hospital timed out and security returned 7; Port Harcourt hospital returned 25 and security timed out; Kano hospital returned 25 and security returned 1. The API correctly reported a 30 km radius on successful responses.

The distance implementation is the standard haversine calculation with Earth radius 6,371 km. Boundary tests from 7.44, 3.90 measured points constructed approximately 30 km north and east as 30.000 km, so the current `> 30` exclusion includes points at exactly 30 km and excludes points beyond it. The radius is a straight-line geographic radius; street-driving distance is calculated separately by the in-app routing component.

## Launch verification after timeout deployment

After commit `87d1773` (`Reduce nearby search provider timeouts`) reached production, the live endpoint returned HTTP 200 and reported `radiusKm: 30` for every tested request. Representative city sample:

| City | Hospitals | Security/police |
|---|---:|---:|
| Lagos | 25 | 21 |
| Ibadan | 25 | 7 |
| Abuja | 25 | 0 |
| Port Harcourt | 25 | 0 |
| Kano | 0 | 1 |
| Kaduna | 0 | 5 |
| Enugu | 25 | 0 |
| Benin City | 25 | 15 |
| Ilorin | 25 | 6 |
| Jos | 0 | 0 |
| Abeokuta | 2 | 0 |
| Calabar | 4 | 0 |

All requests returned HTTP 200. Counts represent named provider records, not generated placeholders. The user screenshot after selecting `Near me` showed the authenticated Marketplace UI, but it captured the old deployment’s `The nearby search took too long` state. The post-fix live API responds in approximately 7.1 seconds for the tested coordinates, below the 15-second client timeout.

This sample demonstrates coordinate-agnostic behavior across multiple Nigerian regions. Sparse or empty categories reflect provider coverage and named-record availability rather than results being taken from another city or filtered outside the 30 km boundary.
