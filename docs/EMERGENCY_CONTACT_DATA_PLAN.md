# Emergency Contact Data Plan

## Current fallback policy

The directory uses **112 as a clearly labeled national emergency fallback** when a state-specific number has not been independently verified. It is not presented as a state police, hospital, fire-service, or NYSC coordinator number. Users are told to ask the dispatcher for the nearest appropriate service.

Existing state-specific police entries are labeled **pending verification**. They are not described as authoritative until their sources are checked again.

## Official-number collection workflow

For each of Nigeria’s 36 states and the FCT, collect police-command and NYSC-secretariat contacts only from an official government or agency publication. Confirm each proposed number through a second official channel, such as the agency website, verified social account, published directory, or direct written confirmation from the relevant command or secretariat.

Never infer numbers from prefixes, copy them from an unverified directory, or generate numbers to fill a gap. Each approved record should include the state, category, organization, phone number, source URL or document, date checked, verifying staff member, and second-source confirmation.

Numbers reported as incorrect should be quarantined immediately and replaced by the 112 fallback until reverified. Review the directory quarterly and before major NYSC service cycles.

## Publication gate

A state-specific number may be published only after two independent official confirmations and a recorded verification date. Until then, the application shows the fallback line and the pending-verification notice. This is safer than presenting a complete-looking directory containing fabricated or stale numbers.

## Mobile table changes

The member property comparison matrix and agent booking table now render as stacked cards on small screens. Desktop users retain the full comparison matrix and table views. Mobile users receive readable summaries, status badges, actions, and payment/rent-schedule controls without horizontal scrolling.

## Relevant implementation

- `src/lib/emergencyContacts.ts` contains fallback records and collection rules.
- `src/app/member/emergency/page.tsx` displays the warning and collection plan.
- `src/app/member/compare/page.tsx` contains mobile comparison cards.
- `src/app/agent/bookings/page.tsx` contains mobile booking cards.

> **Safety rule:** No phone number should be added merely to make every state appear complete. An explicit fallback is safer than a fabricated official contact.

The application is ready to accept verified state records once authoritative source material is available.
