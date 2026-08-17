# UI/UX Visual Review Notes — 2026-08-17

## Corp Member staging screenshot baseline

Source: user-provided screenshot of `https://nysc-mu.vercel.app/member` in authenticated light mode.

### Positive signals

- The global shell has a clear horizontal navigation hierarchy: brand, Explore, Marketplace, My Stays, Messages, Profile, theme control, notifications, account, Premium, and Logout.
- The green brand color is visible in navigation emphasis, verified/status labels, availability indicators, and primary actions.
- Property cards expose useful visual grouping: image, location badge, title, rating, verification, availability, amenities, price, and View Details action.
- The pale light surface is consistent with the supplied light-mode references and provides strong contrast against the white cards.

### Appearance-only issues to address

- A large pale-blue halo/gradient surrounds the page edges and competes with the neutral light dashboard surface; the reference direction is calmer and more neutral. Reduce the decorative glow and keep it subtle behind the shell only.
- The top navigation is visually dense at this viewport width. Improve spacing rhythm and group secondary controls without changing destinations or behavior.
- The Premium feature cards are clipped at the top of the captured viewport and lack a clear section heading/vertical rhythm. Preserve their content but improve section spacing and responsive containment.
- Property cards are tall and visually crowded. Increase internal spacing consistency, tighten metadata line-height, and make the card footer alignment uniform so prices and actions share a baseline.
- The three cards have uneven visual balance because image crops, title lengths, and metadata heights differ. Use fixed image dimensions and a flex column layout for visual consistency only.
- The floating “Manus is browsing…” takeover overlay obscures the lower card actions. This is browser-control UI rather than application UI, but it should be excluded from application visual judgments.
- The dark circular filter badges over images are visually strong; keep them but reduce contrast slightly or align their treatment with the heart button and status badge.
- Light-mode controls use multiple border/radius treatments. Consolidate them into the shared radius and border tokens already introduced in the design system.

### Scope boundary

These notes concern appearance, spacing, typography, color, animation, focus/hover treatment, and responsive layout only. No routes, API calls, authentication, booking logic, message logic, database behavior, or other application functionality should be changed.

## Next visual checks

Review the same Corp Member route in dark mode, then capture Agent and Admin overview shells at the same viewport size to compare navigation density, active-state contrast, card geometry, and theme persistence.


## Live browser check

The connected browser is responsive again, but it is currently on the production sign-in route with a callback to `/member/profile`. The previously filled Corp Member credentials were rejected with an `Invalid email or password` message, so no authenticated dashboard is currently available for visual inspection. This is an access/session state, not evidence of a UI implementation defect. The sign-in screen itself uses the light neutral surface, centered compact card, green brand wordmark, dark primary sign-in button, pale outlined secondary Google action, and green link accents.

Scope remains visual-only: do not change authentication or credentials as part of this UI review.

## Agent overview visual comparison

Source: connected-browser inspection of `https://nysc-mu.vercel.app/agent` in light mode, then the same route after using the visible theme toggle for dark mode.

The Agent overview is visually coherent in both modes and already follows the supplied dashboard direction: left workspace rail, green/blue active navigation treatment, compact premium feature tiles, metric cards, and a clear Add New Property action. The dark mode has strong hierarchy and the main surface is close to the reference direction.

Appearance-only refinements observed: the sidebar active state is a saturated blue rather than the reference green; standardize it to the shared brand-green active treatment across Corp Member, Agent, and Admin. The premium tiles use several unrelated accent hues (blue, purple, cyan, amber, green), which makes the page feel less unified; keep icon differentiation but reduce saturation and anchor all tiles to the green/neutral system. Premium pills are bright cream/white in dark mode and visually compete with the tile titles; use a quieter green-tinted badge. The dashboard has a large amount of unused horizontal space after the fifth tile wraps to a second row; improve the grid’s responsive column behavior and section rhythm without changing content or routes. The Add New Property button remains strongly saturated blue in both themes; align its visual treatment with the primary green action used in the supplied references. Metric cards begin below the fold in the current viewport, so reduce top spacing or balance the premium-feature grid to improve first-screen information density.

The theme toggle successfully switches the visual surface while preserving the Agent route and displayed data. No application behavior was changed during this comparison.

## Admin overview visual inspection

Source: connected-browser inspection of `https://nysc-mu.vercel.app/admin` in dark mode.

The Admin overview has a strong dashboard structure: persistent left rail, active workspace navigation, four top KPI cards, a Platform Analytics section, and a live chart area. The dark surface is readable and the green brand accent is present in the active navigation and health bar.

Appearance-only refinements observed: the Admin shell uses a navy/blue sidebar and a green active state, while Agent uses a lighter sidebar and blue active state; unify both sidebars to one neutral dark/light surface system with the same green active treatment. KPI icons use several pastel colors and feel visually separate from the Neat & Affordable green system; shift them toward green/neutral semantic variants with lower saturation. The sidebar is dense and long at this viewport; improve label grouping, vertical rhythm, and active-state emphasis without removing or changing routes. The page title and KPI row are clear, but the top-right Logout control is visually detached from the main brand chrome; align its spacing and focus treatment with the shared header pattern. The chart and analytics cards should use the same radius, border, shadow, and surface tokens as the Agent and Corp Member cards.

The Admin route rendered as a real authenticated workspace with live-looking values and a coherent dark-mode hierarchy. This review did not submit forms or change data.
