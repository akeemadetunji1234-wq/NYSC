# Mobile responsive findings

The local browser session confirmed the `/signin` surface was light at approximately 892×768. A deterministic Chromium DevTools smoke test then rendered nine routes at a 375×812 mobile viewport after hydration delays: `/`, `/signin`, `/signup`, `/member`, `/agent`, `/admin`, `/member/profile`, `/agent/settings`, and `/admin/profile`.

Every route reported `documentWidth === viewportWidth === 375` and `bodyWidth === 375`, so no horizontal overflow was detected. The protected entry and profile routes correctly redirected to `/signin` without a session. This confirms that the member, agent, and admin profile entry points containing the password controls do not expand the page width at the tested phone viewport, although their authenticated content was not exercised without a session.

The current headless Chromium screenshot encoder produced blank white PNGs even when the DOM was hydrated and the width assertions passed. Those unusable captures were removed from the commit; the route metrics are the authoritative responsive result, and the smoke-test source remains available for repeatable visual-tool follow-up. The test currently covers 375×812 and does not replace a visual review at other phone dimensions such as 390×844.
