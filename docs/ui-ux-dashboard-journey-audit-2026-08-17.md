# NYSC Dashboard Journey and UI/UX Audit Report

**Date:** 17 August 2026  
**Environment:** Production site `https://nysc-mu.vercel.app` with authenticated My Browser sessions  
**Scope:** Corp Member, Agent, and Admin dashboard journeys; live-data checks; authorization boundaries; loading and empty states; high-priority UI/UX remediation.

## Executive summary

The three role workspaces are substantially functional and the read-only audit did not expose privileged content across role boundaries. Corp Member Marketplace coverage and nearby-essentials behavior had already been verified for Abuja, Ibadan, and Lagos within the required 30 km search scope. Agent analytics, Lead CRM empty states, verification status, external-payment handling, and Admin audit/CMS records were database-backed during the audit rather than fabricated.

The most important defect was the Corp Member Messages page displaying **“Please log in to view messages”** during the normal NextAuth session-loading window. The page now distinguishes `loading` from `unauthenticated` and only displays the login message after authentication has definitively failed. My Stays and Transport Guide also received branded skeleton loading states so asynchronous fetches no longer present a misleading pale loader or a contradictory zero-state.

The latest fixes were type-checked, committed to GitHub, and deployed to the Vercel staging deployment. The latest staging deployment reached **READY**. The production alias remained on the earlier `main` deployment during this audit; the staging commit therefore requires promotion to `main` before the changes are live at `https://nysc-mu.vercel.app`.

## Status matrix

| Area | Result | Evidence or follow-up |
|---|---|---|
| Corp Member workspace | Passed with UX findings | Dashboard, Marketplace, Profile, Premium, Compare, Transport, Notifications, Artisan Directory, Offline, and role protection were inspected. |
| Corp Member Messages | Fixed in source | Session loading is now handled before the unauthenticated message is rendered. Authenticated browser confirmation remains recommended after production promotion. |
| My Stays loading | Fixed in source | Three branded property-card skeletons replace the text-only loader. |
| Transport loading | Fixed in source | Four responsive guide-card skeletons replace the transient loading/zero-state presentation. |
| Agent workspace | Mostly passed | Live properties, bookings, messages empty state, reviews empty state, analytics, leads, verification, settings, support, premium, and earnings were inspected. Viewings failed after loading and requires investigation. |
| Admin workspace | Mostly passed | Live users, agents, artisans, disputes, audit logs, and CMS content were inspected. `/admin/safety` returned 404; Payouts and Settings were blocked by session loss during direct navigation. |
| Authorization | Passed for tested boundary | A Corp Member navigating directly to `/agent` and `/admin` was redirected back to `/member`. |
| Type safety | Passed | `pnpm exec tsc --noEmit` completed successfully after the fixes. |
| GitHub | Passed for staging | Commits `123074c` and `3c73d3a` were pushed to `staging/nysc-hardening-auth-e2e`. |
| Vercel staging | Passed | Latest commit `3c73d3a` reached `READY` at deployment `dpl_FL9fQPdZ22doExeynSZgYjnXLz2m`. |
| Vercel production | Pending promotion | Production was still serving the prior `main` commit at the time of this report. |

## Corp Member journey

The authenticated dashboard loaded correctly and showed three properties. Marketplace exposed all nine categories, the location prompt, and nearby search behavior. The primary UX opportunities are stronger location-permission feedback, clearer active-tab contrast, and a less crowded category rail on desktop.

My Stays exposed Upcoming Stays, Past Stays, Saved Lodges, and My Viewings. The original loading experience was a weak text-only panel with low visual hierarchy. This was replaced with three responsive skeleton cards that match the property-card layout. The settled empty state remains explicit and provides an Explore Lodges action.

Messages previously showed the login error even when the dashboard was authenticated. The source now reads the NextAuth `status`, renders a loading state while the session is being established, and only renders the login message for an unauthenticated or missing-user state. The page continues to pass the resolved user ID to the shared chat interface.

Notifications currently behaves as a Premium-gated New Listing Alerts page rather than a general notification inbox. This is a product/entitlement consistency issue: booking confirmations, message alerts, and other account notifications should be distinguished from Premium saved-search alerts. Artisan Directory and Offline Mode use similarly minimal Premium gates and would benefit from a shared feature-preview pattern that clearly separates **feature unavailable** from **feature active**.

Profile loaded with personal information and PPA status. Premium showed the required ₦5,000/month plan and correctly explained that activation is administrator-handled rather than an in-app property checkout. Compare showed a clear no-selection state. Transport Guide loaded 37 state guides; its original transient “0 states”/text-loader behavior was replaced by guide-card skeletons during fetch.

## Agent journey

The Agent Overview loaded with live summary values: three active properties, four total bookings, and a 0.0 average rating based on zero reviews. Four recent bookings were shown as confirmed. Premium quick actions included Boost Listings, Advanced Analytics, Lead CRM, Verified Badge, and Priority Support.

My Properties showed three active published listings with search, status filtering, Edit, and Delete controls. The route rendered database-backed listing values. Destructive actions were not submitted during the audit; ownership checks and confirmation behavior remain required for any future mutation test.

Agent Bookings initially showed a misleading `Showing 1 to 0 of 0 results` while the table was loading, then settled to four records matching the Overview total. The settled records included external payment confirmation fields and View Details actions. The initial loading/zero-count race should be addressed with a stable table skeleton in a later pass.

Agent Viewings initially showed `Loading viewings...` and then transitioned to the browser error page **“This page couldn’t load.”** This is the most serious unresolved Agent defect and requires source/runtime-log investigation before launch.

Agent Messages settled to the accurate empty state `No messages yet` with a conversation-selection prompt. Agent Reviews settled to `No reviews found` while retaining an accurate 0.0/0 summary. Agent Analytics displayed real date-range controls and CSV export. For 18 July–17 August 2026 it showed 11 views, zero saves, inquiries, bookings, and boosts; listing rows reflected recorded property events without fabricated activity. Lead CRM showed real-data empty state messaging and status taxonomy (NEW, CONTACTED, QUALIFIED, VIEWING, WON, LOST, CLOSED).

Verification reported the live account as Verified with an administrator-approved request. Settings showed editable business profile, phone, WhatsApp, experience, and biography fields; no changes or uploads were submitted. Premium displayed Agent Free at ₦0/month and Agent Premium at ₦10,000/month, with an active Premium expiry date. Support exposed priority support UI, but the displayed phone/email channels must be confirmed as monitored before launch. Earnings correctly presented external payment confirmations as reference-only and not as a withdrawable wallet balance.

## Admin journey

Admin Overview loaded live aggregates including 13 users, two agents, zero pending agents, three properties, ₦390,000 in weekly external-payment references, one verified agent, and 100% verification health. The external-payment wording correctly reflects the requirement that the app does not collect or transfer property funds.

Corp Members showed live user records, Premium badges, active status, join dates, search, status filters, and moderation action menus. Agents & Hosts settled to two live agent records with active statuses. Artisan Directory showed one live artisan record with Add, Search, Edit, and Delete controls. Disputes & Reports showed one live resolved high-priority safety ticket with property, amount, parties, and message details.

Audit Logs passed the live accountability check. The table displayed timestamps, actions, target IDs, details, and actor IDs for events including role changes, bans/unbans, agent verification, property creation/deletion, booking status changes, external-payment confirmation, Premium grants, CMS saves, and administrator password changes.

CMS & Content passed the live-data check with 37 published transport-guide records covering Nigerian states and Abuja. Each item exposed a slug, title, description, Edit action, and Delete action. No mutation was submitted.

A direct navigation to `/admin/safety` returned a 404 Page Not Found even though the sidebar exposed Listing Safety. This is a launch-blocking route/link inconsistency: implement the page or remove/replace the sidebar link. `/admin/partnerships` remained on `Verifying admin access...` during capture and should receive a timeout/error state. Direct navigation to `/admin/payouts` and `/admin/settings` redirected to sign-in after the connected Admin session was lost; these two modules need a repeat inspection with a fresh authenticated Admin session before being classified as defects.

## Authorization and security observations

Corp Member access to `/agent` and `/admin` was denied by redirect to `/member`, and no privileged page content was exposed. The redirect is silent, so a brief non-sensitive notice such as **“You do not have access to this workspace”** would make the behavior clearer without revealing authorization details.

The audit respected the no-payment-gateway requirement. Property payment was represented as an external arrangement confirmed by an Agent; the application did not collect, hold, or transfer property funds. No destructive Admin or Agent action, upload, payment, or profile mutation was submitted during the read-only journey.

## Implemented source changes

The following changes are included in the staging branch:

1. The Member Messages page now handles NextAuth session loading separately from unauthenticated access and resolves the user ID from the session shape used by the application.
2. `src/styles/theme.css` now defines an ease-out curve, 100/200/300 ms duration tokens, and reusable motion timing variables.
3. My Stays now renders three branded skeleton cards matching the listing layout while bookings, saved lodges, and viewings load.
4. Transport Guide now renders four responsive skeleton guide cards while the live CMS records load.

## Release verification

`pnpm exec tsc --noEmit` completed successfully after the latest source change. The staging branch was pushed to GitHub with commit `3c73d3a` (`Handle messages session loading state`) after the earlier UX commit `123074c`. The Vercel staging deployment for `3c73d3a` reached `READY` at `https://nysc-m1unjadlh-akeemadetunji1234-wqs-projects.vercel.app`. Unauthenticated HTTP smoke checks returned 200 for `/signin` and `/member/messages` on that deployment. These checks confirm routing availability, not an authenticated chat conversation.

## Recommended next actions

Before public launch, promote the reviewed staging commit to `main` and verify the production alias. Then repeat the authenticated Member Messages check, investigate the Agent Viewings runtime failure, implement or remove `/admin/safety`, and repeat Admin Payouts, Settings, and Partnerships with a fresh Admin session. A follow-up UX pass should add consistent Premium feature previews, stable skeletons to the remaining dashboards, a role-redirect notice, reduced-motion handling, and shared card/tab/modal transition classes.

For production readiness beyond this UI pass, continue the previously identified security work: rotate exposed credentials, purge historical secrets, use reviewed Prisma migrations, harden uploads, add distributed rate limiting and bot protection, consider PostgreSQL RLS, encrypt sensitive profile/document fields, and verify monitoring, backups, support channels, and rollback procedures.

## References

[1]: https://nysc-mu.vercel.app "Neat & Affordable production application"
[2]: https://nysc-m1unjadlh-akeemadetunji1234-wqs-projects.vercel.app "Latest READY staging deployment"
[3]: https://github.com/akeemadetunji1234-wq/NYSC "NYSC GitHub repository"
