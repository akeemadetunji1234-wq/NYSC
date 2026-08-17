# UI/UX and Dashboard Journey Audit

**Date:** 2026-08-17
**Environment:** Production `https://nysc-mu.vercel.app`

## Initial Corp Member observation

The authenticated Corp Member dashboard loaded successfully at `/member`. The primary navigation exposed Explore, Marketplace, My Stays, Messages, and Profile, with theme toggle, notifications, Premium badge, and logout controls. The page rendered three property cards and four premium feature tiles for New Listing Alerts, Offline Mode, Transport Guides, and Artisan Directory.

The visual system currently uses a bright green brand palette, rounded cards, and large hero blocks. The screenshot shows an overly dense focus/annotation state around many controls during browser inspection; visual QA should separately confirm the normal non-annotated rendering. Initial UX opportunities include stronger hierarchy between the hero search and feature tiles, more distinctive dashboard status treatment, and consistent motion/reduced-motion behavior across cards and navigation.

## Corp Member journey observations

The Marketplace route loaded and exposed all nine categories, Near me, a location-state control, and the required empty-location prompt. The category rail is horizontally scrollable and visually crowded on a desktop viewport; the primary CTA and location state are easy to miss below the hero. The page is structurally usable but would benefit from a clearer location permission state, stronger active-tab contrast, and responsive category affordances.

My Stays loaded with Upcoming Stays, Past Stays, Saved Lodges, and My Viewings tabs, but the captured state remained on a very pale loading view with weak contrast and no visible loading explanation or skeleton content. This is a likely UX defect: the page should resolve quickly to a clear empty state or show a branded, accessible skeleton with timeout/error handling.

## Corp Member communication observations

The Messages route rendered the shared shell but showed **“Please log in to view messages”** despite the authenticated dashboard session working on other member routes. This is a functional/session-handoff defect and should be treated as higher priority than a visual polish issue.

The Notifications route rendered as a Premium-gated New Listing Notifications page with an upgrade CTA rather than a general notification inbox. The messaging and notification surfaces therefore need a product decision and implementation alignment: realtime booking/message alerts should remain available to eligible users, while saved-search alerts can remain a Premium feature. The current route behavior is confusing because the global bell and the notifications route do not appear to represent the same capability.

## Corp Member profile and premium observations

Profile loaded successfully and showed personal information, PPA status, Edit Profile, and Set PPA actions. The page is functionally understandable, but the captured visual state has very low-contrast text and large unused whitespace; the primary profile completion action should be more prominent and the PPA setup should use a clearer progress/status pattern.

Premium loaded with the ₦5,000/month plan, Free/Premium comparison, feature list, and an administrator-handled activation explanation. The copy appropriately avoids presenting property payment as an in-app checkout, but the page is visually long and the main upgrade/status actions are separated from the plan cards. The current design also mixes “notifications” as a Free Plan item with “New Listing Notifications” as a Premium-gated route, which should be reconciled in the entitlement UX.

## Corp Member directory and comparison observations

Artisan Directory loaded as a clear Premium Feature gate with an upgrade CTA. The page is visually minimal but the empty area is excessive; it should explain at least one concrete benefit, show a preview card or category examples, and use a consistent premium-gate pattern shared with Notifications.

Compare loaded correctly and showed a clear no-selection state with a Back to Explore action. This is one of the stronger empty states, although the page would benefit from a short explanation of how many properties can be compared and where the compare control appears on listing cards.

## Corp Member transport and offline observations

Transport Guide loaded with **37 states**, search, refresh, Abuja and Abia cards, and clear reference-only/payment disclaimers. The browser’s initial extracted content briefly showed “0 states” and “Loading current fare ranges…” before the visual page resolved, indicating a noticeable async loading transition that should use an intentional skeleton and avoid rendering a contradictory zero-state during fetch.

Offline / Low Data Mode loaded as a Premium gate with clear benefit copy and CTA. It shares the same minimal premium-gate pattern as Artisan Directory, but the product should distinguish “feature unavailable” from “offline mode currently active” and explain what is saved or how activation works after upgrade.

## Role-protection observations

While authenticated as a Corp Member, navigating directly to `/agent` and `/admin` redirected back to `/member` and did not expose privileged content. This is a positive authorization result. The redirect is silent, however; a brief “You do not have access to this workspace” notice would improve user comprehension and reduce the appearance of a broken route.
# Agent Journey Audit Notes — 2026-08-17

## Overview (`/agent`)

The authenticated Agent portal loaded successfully and displayed the live Overview workspace. The page greeted the signed-in agent, exposed Add New Property, showed 3 Active Properties, 4 Total Bookings, and an Average Rating of 0.0 based on 0 reviews. Four recent bookings were rendered with Confirmed status. The overview also showed premium quick actions for Boost Listings, Advanced Analytics, Lead CRM, Verified Badge, and Priority Support. A Listing Performance section displayed lifetime totals for published and draft listings.

**Initial assessment:** Passed for route loading and server-backed summary rendering. UX follow-up: premium feature tiles appear visually available but marked Premium; verify whether clicking them gives a consistent gate rather than a dead end. The dashboard currently reports 4 confirmed bookings while the rating correctly indicates no reviews, so the metrics should be checked against the underlying records during later authenticated workflow testing.

## Browser evidence

Captured from the authenticated My Browser session at `https://nysc-mu.vercel.app/agent` on 2026-08-17. No credentials, tokens, or personal secrets recorded.

## My Properties route-protection observation

A direct navigation to `/agent/properties` redirected to the sign-in page in the connected browser instead of preserving the Agent session. This is **Blocked for authenticated inspection** until the session is restored; it may indicate session expiry or a browser-session transition rather than a route defect. No protected data was exposed.

## My Properties (`/agent/properties`)

The authenticated route loaded three active, published property cards with real-looking database fields: Gwagwalada Double Room Lodge (₦120,000/year, 2 rooms, 2 active bookings), Executive Studio Apartment (₦180,000/year, 1 room, 1 active booking), and Silver Heights 1-Bedroom Lodge (₦150,000/year, 1 room, 1 active booking). Search and status filtering were visible, along with Edit and Delete actions. **Assessment: Passed for read-only rendering.** Follow-up: destructive Delete requires confirmation and ownership checks; the card titles are visually truncated in the screenshot, so responsive accessibility should be checked.

## Bookings (`/agent/bookings`)

The page clearly explains that agents confirm property payments received outside the app and that the platform never collects, holds, or transfers property funds. Search, Filters, pagination, and the table headings for booking ID, guest, property, dates, rent reference, booking status, external payment, and actions were present. At capture time, the table remained on `Loading booking requests...` and reported `Showing 1 to 0 of 0 results`, despite the Overview showing four confirmed bookings. **Assessment: UX/data-loading issue — needs a second wait or refresh check; if persistent, this is a functional defect or an overly confusing loading/empty-state race.**

## Bookings settled state

After waiting, the Bookings table populated four records, matching the Overview total: WGDWKZ, 3YUG9V, 8T6RN0, and 9NYH1Z. Three records were Confirmed with external payment confirmed outside the app; one was Confirmed with external payment not confirmed. View Details actions were present. **Assessment: Passed after async settlement, but the initial loading state incorrectly showed 0 results and should use a stable skeleton rather than a misleading empty count.**

## Viewings (`/agent/viewings`)

The route loaded its title and description but remained on `Loading viewings...` at first capture, with no list or explicit empty state. **Assessment: Pending async verification; potential loading-state UX defect.**

## Viewings settled state

After waiting, `/agent/viewings` changed from its in-app loading screen to the browser error page `This page couldn’t load`, with only Reload and Back. **Assessment: Failed in the live session.** The route either threw a runtime/server error or lost the session during client loading; this needs source/log investigation before launch.

## Messages (`/agent/messages`)

The Agent inbox route loaded with the authenticated Agent Portal shell and the heading `Inbox — Respond to inquiries from Corp Members`, but remained on `Loading your inbox...` at capture time. The sidebar and Agent identity were present. **Assessment: Pending async verification; likely needs a settled-state check and a visible empty/error state if there are no conversations.**

## Messages settled state

The Agent inbox resolved to a clear empty state: `No messages yet` with `Select a conversation to start messaging`. **Assessment: Passed for empty-state handling.** The platform did not fabricate conversations.

## Reviews (`/agent/reviews`)

The route rendered a 0.0 rating, 0 Total Reviews, rating distribution bars, and `Loading reviews...` below the summary. **Assessment: Pending async verification; the summary is correctly zero-valued, but the list needs to resolve to an explicit empty state rather than remain loading.**

## Reviews settled state

The Agent Reviews page resolved to `No reviews found.` while keeping the accurate 0.0 / 0 Total Reviews summary. **Assessment: Passed for empty-state handling.**

## Premium (`/agent/premium`)

The page displayed `Premium Agent — Active`, a Free Agent tier at ₦0/month, and a Premium Agent tier at ₦10,000/month. It listed the stated benefits including up to 15 properties, boosted listings, badge, analytics, alerts, priority support, and Lead CRM. It also reported `Premium Active — expires 8 September 2026`. **Assessment: Passed for entitlement display and pricing copy.** UX follow-up: the page is long and visually sparse in the initial viewport; the `Previous Plan` label and premium active state should be checked for accessible hierarchy and clear next action. No payment action was taken.

## Analytics (`/agent/analytics`)

The signed-in Premium Agent received the live analytics dashboard after the access check. It exposed From/To date inputs, Apply, and CSV export. For 2026-07-18 through 2026-08-17 it reported 11 Views, 0 Saves, 0 Inquiries, 0 Bookings, 0 Boosts, and a 0.00% inquiry rate. Listing rows showed 2 views for Silver Heights, 3 for Executive Studio Apartment, and 6 for Gwagwalada Double Room Lodge, with zeros elsewhere. The page explicitly stated that metrics come from property-event records and that listings with no events show no fabricated activity. **Assessment: Passed for real, date-ranged, non-fabricated analytics and export affordance.**

## Lead CRM (`/agent/leads`)

The Lead CRM resolved from `Loading live leads...` to `No real enquiries match this filter yet.` It exposed status filters for All, NEW, CONTACTED, QUALIFIED, VIEWING, WON, LOST, and CLOSED, plus Refresh. **Assessment: Passed for real-data empty state and workflow taxonomy.** No fabricated leads or metrics were shown. Export and status mutation controls were not available in the empty state, so the full lifecycle remains Not tested.

## Verification (`/agent/verification`)

The tracker loaded successfully and reported Current Status `Verified`. It showed the Agent account for Bola Ahmed, a verification request approved by an administrator, and an active Verified Agent badge. Benefits were described as badge visibility on published listings, stronger trust for Corp Members, and eligibility for premium listing tools. **Assessment: Passed for read-only status tracking.** No upload or mutation was performed.

## Settings (`/agent/settings`)

The Agent Settings page loaded a Business Profile form with Save Changes and Upload Logo controls. It displayed live profile values for Business/Agency Name (`Bola Ahmed`), Contact Email, and WhatsApp Number, plus fields for mobile phone, agency name, years of experience, and bio/about. **Assessment: Passed for read-only rendering.** Sensitive contact data was not copied into this audit beyond confirming that fields are populated; no edits or uploads were submitted. The WhatsApp number field is a critical contact surface and should remain validated and normalized server-side.

## Support (`/agent/support`)

The authenticated Premium Support page rendered a Start Live Chat action, a priority ticket form with Subject and Details fields, and direct phone/email contact copy. **Assessment: Partially passed for UI availability, but operational readiness is Not tested.** The displayed `0800-PREMIUM-AGENT` phone line and `vip@neataffordable.ng` address must be confirmed as monitored, real support channels before public launch; otherwise the UI risks presenting fabricated contact information.

## Earnings (`/agent/earnings`)

The route rendered an External Payment Confirmations page that explicitly states the app does not collect, hold, or transfer property funds. It reported ₦0 and 0 booking records marked as paid outside the app, with a clear note that this is reference-only and not a withdrawable wallet balance. **Assessment: Passed for the no-payment-gateway requirement and non-fabricated empty state.**
# Admin Journey Audit Notes — 2026-08-17

## Overview (`/admin`)

The authenticated Admin workspace loaded successfully with a live Overview & Analytics page. It reported 13 Total Users, 2 Total Agents, 0 Pending Agents, and 3 Properties. Platform Analytics showed ₦390,000 in Weekly External Payment References, 1 Verified Agent, and Verification Health at 100% with a 24-hour SLA label. A weekly external-payment chart was present. **Initial assessment: Passed for route loading and live aggregate presentation, subject to checking that each downstream module is database-backed and that the external-payment wording remains reference-only.**

The Admin sidebar exposed Overview & Analytics, Corp Members, Agents & Hosts, Artisan Directory, Property Backlog, Disputes & Reports, Listing Safety, Audit Logs, and CMS & Content. No mutation was submitted.


## Corp Members (`/admin/users`)

The User Management table resolved to show live Corp Member records including Bola Ahmed, Brevo OTP Retest, Test Member 2, SMTP Rotation Smoke Test, NYSC Corp Test, Akeem, Bola Olabode, and Tunde And Co. Premium badges were visible for eligible users. All displayed users were Active and joined on 17/08/2026. Search and status filtering (All, Active, Pending, Banned) were present, along with action menus. **Assessment: Passed for live user rendering and moderation affordance.**

## Agents & Hosts (`/admin/agents`)

The route loaded its title and description but remained on the table header at first capture. **Assessment: Pending async verification; needs a settled-state check for real agent records.**

## Agents & Hosts settled state

The Agents & Hosts table resolved to show two live Agent records: NYSC Agent Test and Bola Ahmed. Both were Active and joined on 17/08/2026. **Assessment: Passed for live agent rendering.**

## Artisan Directory (`/admin/artisans`)

The Artisan Directory loaded one live record: Akeem Adetunji (Plumber, Ikeja, Lagos, 5.0 rating, Unverified). The page exposed Add Artisan, search, and Edit/Delete actions. **Assessment: Passed for live artisan rendering and management affordance.**

## Property Backlog (`/admin/backlog`)

The Listing Backlog page loaded its title and description but remained on a skeleton/empty state at capture time. **Assessment: Pending async verification; needs a settled-state check for real pending listings.**

## Disputes & Reports (`/admin/disputes`)

The route resolved to show one live ticket: TKT-CMSRX (HIGH priority, Safety Concern, Akeem Adetunji vs Bola Ahmed, RESOLVED on 8/13/2026). The ticket details included the reported property (Executive Studio Apartment), the amount (₦180,000), and a message from the user. **Assessment: Passed for live dispute rendering and mediation UI.**

## Listing Safety (`/admin/safety`)

A direct navigation to `/admin/safety` resulted in a 404 Page Not Found error. **Assessment: Failed — route missing or misconfigured.** This module was present in the sidebar but the underlying page was not found; it needs to be implemented or the link removed before launch.

## Audit Logs (`/admin/audit`)

The Audit & Activity Logs resolved to show a real-time security trail including CMS_CONTENT_SAVED, PREMIUM_GRANTED, BOOKING_STATUS_UPDATED, EXTERNAL_PAYMENT_CONFIRMED, ADMIN_PASSWORD_CHANGED, PROPERTY_DELETED, PROPERTY_CREATED, AGENT_VERIFIED, ADMIN_PROFILE_UPDATED, USER_ROLE_CHANGED, USER_UNBANNED, USER_BANNED, and ARTISAN_VERIFIED/UNVERIFIED. Records dated back to 14/08/2026 and included timestamps, actions, target IDs, details, and actor IDs. **Assessment: Passed for live security event tracking and accountability.**

## CMS & Content (`/admin/cms`)

The CMS & Content Management page resolved to show 37 Published Content Items, all of which were Transport Fare Guides for various Nigerian states (Zamfara, Yobe, Taraba, Sokoto, Rivers, Plateau, Oyo, Osun, Ondo, Ogun, Niger, Nasarawa, Lagos, Kwara, Kogi, Kebbi, Katsina, Kano, Kaduna, Jigawa, Imo, Gombe, Enugu, Ekiti, Edo, Ebonyi, Delta, Cross River, Borno, Benue, Bayelsa, Bauchi, Anambra, Akwa Ibom, Adamawa, Abuja, and Abia). Each item had a slug, title, description, and Edit/Delete actions. **Assessment: Passed for live content management and database-backed transport guides.**

## Partnerships (`/admin/partnerships`)

The route loaded its title and description but remained on `Verifying admin access...` at first capture. **Assessment: Pending async verification; potential loading-state UX defect.**

## Payouts (`/admin/payouts`)

A direct navigation to `/admin/payouts` redirected to the sign-in page in the connected browser instead of preserving the Admin session. This is **Blocked for authenticated inspection** until the session is restored; it may indicate session expiry or a browser-session transition rather than a route defect. No protected data was exposed.

## Settings (`/admin/settings`)

A direct navigation to `/admin/settings` redirected to the sign-in page in the connected browser instead of preserving the Admin session. This is **Blocked for authenticated inspection** until the session is restored.
