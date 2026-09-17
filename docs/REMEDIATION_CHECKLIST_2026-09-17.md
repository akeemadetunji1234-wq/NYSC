# NYSC Remediation Checklist — 17 September 2026

## Executive summary

The repository changes in this remediation address the mobile comparison experience, safety-link sharing, marketplace overflow, nearby-result consistency, public robots disclosure, agent tier scoring, fraud-risk review signals, production-readiness diagnostics, and NDPR export capability. The production build and TypeScript validation must pass before deployment. Several checklist items require an authenticated human, provider-console access, an inbox, official government data, or business/legal approval. Those items are not treated as complete merely because the source code exists.

## Checklist status

| Item | Status | Finding or implementation |
|---|---|---|
| 1. Mobile comparison and safety sharing | Implemented | Mobile comparison cards now show description, location, rooms, agent, verification, amenities, and listing access. Safety records have a visible share control and public links expose the current status. |
| 2. Pusher auth and scheduled-viewing logs | Partially verified | Database notification records show successful `SENT` delivery with no recorded realtime errors. The current repository has no separate scheduled viewing-reminder job. Production console logs still require an authenticated Vercel/provider-console check. |
| 3. Real browser Pusher delivery | Not independently confirmed | The notification delivery path and dashboard exist, but a real authenticated browser session has not received a newly triggered viewing event in this verification run. |
| 4. Brevo inbox delivery | Not independently confirmed | The database contains successful email-delivery timestamps for some viewing notifications, but no human inbox or spam-folder confirmation is available. |
| 5. Human role workflows | Blocked on credentials and user action | The connected browser was not authenticated when tested. A real Corp Member, Agent, and Admin walkthrough requires test accounts and an inbox/OTP destination. |
| 6. Emergency contacts | Correctly not fabricated | The application retains verified state-specific entries and an explicit fallback. Additional official numbers require collection and approval from authoritative state or police sources. |
| 7. Production Mapbox token | Diagnostic added; production value unconfirmed | Admin operational diagnostics now report whether a Mapbox token is present. Vercel environment access was not available in this run, so the production value cannot be attested here. |
| 8. Safari/Firefox | Not independently confirmed | Source-level responsive fixes were tested through TypeScript/build checks. A real Safari and Firefox browser pass still requires those browsers or a browser-testing service. |
| 9. Legal pages | Owner review required | Privacy, Terms, and Safety pages exist. Their final wording depends on the owner’s actual verification process, retention policy, support process, and legal review; those facts must not be invented by the implementation agent. |
| 10. Marketplace containment | Implemented | The nearby-results section and cards now use `min-w-0` and `overflow-hidden`, preventing long addresses, buttons, and map content from bleeding outside the marketplace container. |
| 11. Nearby-result consistency | Implemented as a stability layer | Nearby results are cached per category and rounded location for 24 hours in the browser, and the API response advertises a one-day cache window. Manual retry bypasses the cache. Provider data can still change after the cache expires. |
| 12. Admin path in robots.txt | Fixed in source | The admin path is no longer listed in generated robots metadata. Authentication remains the real security boundary. The current public deployment still serves the previous robots response until the new commit is deployed. |
| 13. Distributed rate limiting | Diagnostic added; production value unconfirmed | Admin operational diagnostics now expose whether Upstash credentials are configured. Without Upstash, the code’s bounded in-memory fallback is not a cross-instance production control. Vercel environment access was unavailable for confirmation. |
| 14. Live provider assurance and dependency freshness | Partially addressed | Provider readiness diagnostics cover Paystack, email, Pusher, Mapbox, and distributed rate limiting. A real Paystack transaction, Pusher browser event, inbox delivery, and Vercel environment attestation still require external credentials and human confirmation. Dependency update work should remain a controlled maintenance change rather than an untested bulk upgrade. |
| 15. Agent premium tiers and reviews | Implemented | Agent dashboard scoring now calculates Bronze, Silver, or Gold from viewing response rate, completed viewings, and property reviews. The score and supporting metrics are displayed transparently. |
| 16. WhatsApp viewing reminders | Feasible but provider-blocked | Automated reminders require a WhatsApp Business provider, approved message template, recipient consent, and credentials. The current app has agent WhatsApp fields but no approved outbound WhatsApp provider configuration. |
| 17. Fraud-pattern detection | Implemented as review signals | Admins now have a Fraud Risk Signals page. It flags unusual combinations of recent listing spikes, low response rate, slow responses, and no completed viewings. Signals are explicitly not proof of fraud. |
| 18. Geographic gap analysis | Already implemented and retained | Admin analytics already compare PPA demand with listed-property supply by LGA and label shortage levels. |
| 19. Admin impersonation/view-as mode | Not enabled | This is a high-risk privacy feature. It requires an explicit support workflow, time-limited signed access, target-user notification, action restrictions, and mandatory audit events. It should not be enabled silently without the owner approving those controls. |
| 20. NDPR compliance export | Implemented | An admin-only, no-store JSON export endpoint now returns the selected user’s non-secret account, listing, booking, review, message, and safety records and writes an `NDPR_DATA_EXPORT` audit entry. It excludes passwords, OTPs, sessions, and provider credentials. |

## Verification limits

The production health endpoint responded successfully, but the public deployment still served the previous robots response during this run. This indicates that source changes require a new deployment before production behavior can be rechecked.

The connected browser opened the production sign-in page but did not contain an authenticated user session. No OTP, booking, message, Pusher, or inbox test was therefore performed using a real person’s account. No credentials were fabricated, and no official emergency numbers were invented.

## Launch sign-off requirements

Before launch, the owner should confirm the Vercel values for `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`, `BREVO_API_KEY` or SMTP credentials, `PAYSTACK_SECRET_KEY`, `MAPBOX_TOKEN` or `NEXT_PUBLIC_MAPBOX_TOKEN`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN`. The owner should then complete one controlled test for each provider and record the resulting IDs, timestamps, and inbox/browser evidence in the deployment verification report.

The owner or legal adviser must approve the Privacy, Terms, and Safety content. The operations owner must provide authoritative emergency-contact sources for each state before state-specific numbers replace the generic fallback.

## References

[1]: https://ndpc.gov.ng/ "Nigeria Data Protection Commission"
[2]: https://www.pusher.com/docs/ "Pusher documentation"
[3]: https://developers.brevo.com/ "Brevo developer documentation"
[4]: https://www.mapbox.com/ "Mapbox documentation"
