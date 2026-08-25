# NYSC Performance Bottleneck Analysis

**Repository:** `akeemadetunji1234-wq/NYSC`
**Branch:** `main` (merged from `security/authorization-isolation-audit`)
**Scope:** Intermittent slow page loads, client-side startup work, landing-page rendering, and protected-route navigation.

## Executive conclusion

The available measurements do not indicate a persistent static HTML server bottleneck on the public or authentication pages. The local optimized production server returned approximately **4–8 ms TTFB** for `/`, `/signin`, and `/signup`, while the development server returned approximately **30–60 ms TTFB**. The database-backed `/api/health` endpoint returned in approximately **86 ms**, which is consistent with database connection and query work rather than static page delivery. These measurements are recorded in the final project audit [1].

The more credible explanation for intermittent perceived slowness is a combination of **client hydration and animation work**, duplicated client provider boundaries on protected pages, image decoding, route-level database work, and serverless/database cold starts. The changes in this pass remove avoidable client work without changing authorization or data freshness behavior.

## Evidence-based bottleneck inventory

| Area | Evidence in the code or measurements | Likely user impact | Disposition |
|---|---|---|---|
| Public/auth server response | Optimized local production TTFB was approximately 4–8 ms for the public and auth pages [1]. | A persistent static-server delay is unlikely to be the dominant cause. | Confirmed low priority |
| Database-backed requests | `/api/health` measured approximately 86 ms [1]. Protected pages also perform role-specific database work. | Cold starts, connection setup, and sequential queries can make dashboards feel intermittently slow. | Requires deployed route/query timing before changing cache policy |
| Global `SessionProvider` | The root layout mounted NextAuth context for every route, even though all `useSession` consumers are under protected member, agent, or admin routes. | Adds an avoidable client boundary to public/auth pages and can trigger a browser session request when a consumer is mounted. | **Fixed:** provider is scoped to protected layouts |
| Redundant protected session fetch | Server layouts already call `getServerSession`, while role layouts mounted a client `SessionProvider` without passing the validated session. | Protected pages can briefly show a loading state and perform an unnecessary client session fetch. | **Fixed:** role layouts hydrate `SessionProvider` with the server session |
| Duplicate theme providers | Member and agent layouts, plus the admin client shell, mounted additional `ThemeProvider` instances below the root provider. | Extra localStorage/matchMedia effects and root-class writes during dashboard startup. | **Fixed:** protected layouts now share the root theme provider |
| First-paint page transition | `PageTransition` initially rendered protected content at `opacity: 0`, translated and scaled for a 260 ms transition. | A valid page can look blank or delayed even when its HTML and data are ready. | **Fixed:** initial render is immediate; exit animation remains available |
| App/auth entrance wrappers | The app `template.tsx` and top-level sign-in, sign-up, forgot-password, and reset-password motion cards initially rendered with `opacity: 0`; the first live Lighthouse run reported `NO_FCP` on both the production home and sign-in routes. | The browser could receive HTML but paint no content while waiting for client animation, creating the exact slow/blank behavior reported by users. | **Fixed:** these top-level wrappers now use `initial={false}`; post-fix live Lighthouse runs paint successfully |
| Landing-page motion tree | `App.tsx` is a large client component with hero motion, animated CTA controls, animated Bento items, count-up stats, and a scroll listener. | Hydration and main-thread animation work can delay interaction, especially on phones or low-power devices. | Partially optimized; frame cancellation, reduced-motion handling, and scroll coalescing are implemented |
| Hero image | The landing hero is a full-viewport image. It was previously a CSS background and is now a prioritized `next/image` with responsive `sizes`. | Large image transfer and decoding can compete with first paint. | **Improved:** Next image optimization and responsive source selection are active |
| Below-fold content | Features, testimonials, agent CTA, and footer are rendered in the same client component. | Below-fold motion and component code still contribute to the initial JavaScript bundle. | Follow-up opportunity; requires bundle and Web Vitals measurement before lazy-loading |

## Changes implemented in this pass

The public shell no longer mounts `SessionProvider`; authentication context is mounted only inside the member, agent, and admin layouts. Each protected layout passes the server-validated session into `SessionProvider`, preventing a redundant client session bootstrap and reducing protected-route loading flicker. The admin, member, and agent layouts also no longer mount duplicate theme providers.

The shared `PageTransition` wrapper now uses `initial={false}`, which removes the blank-looking initial opacity/scale transition while preserving its exit behavior and reduced-motion handling. The app-wide `template.tsx` and top-level auth cards now also use `initial={false}`; this removed the live Lighthouse `NO_FCP` failure from production home and sign-in routes. On the landing page, count-up animation frames are canceled during cleanup, reduced-motion users receive the final values without an animation loop, repeated count values do not trigger redundant state updates, and scroll state updates are coalesced through `requestAnimationFrame`.

These are deliberately conservative optimizations: they do not change API contracts, authorization decisions, database query semantics, or the user’s ability to control dashboard theme preferences.

## Live Lighthouse evidence

The post-fix production Lighthouse runs on `https://nysc-mu.vercel.app/` and `/signin` were completed on 2026-08-25. Mobile home scored **0.99 Performance**, with FCP **1.4 s**, LCP **2.0 s**, Speed Index **2.7 s**, TBT **0 ms**, CLS **0**, and root-document latency **20 ms**. Mobile sign-in scored **0.99 Performance**, with FCP **1.1 s**, LCP **1.9 s**, Speed Index **2.6 s**, TBT **0 ms**, CLS **0**, and root-document latency **30 ms**. Desktop home scored **1.00 Performance**, with FCP/LCP **0.3 s**, Speed Index **0.5 s**, TBT **0 ms**, CLS **0**, and root-document latency **10 ms**. The pre-fix mobile home and sign-in artifacts both recorded Lighthouse `NO_FCP`; the top-level opacity-zero wrappers were the confirmed cause. See [`LIGHTHOUSE_PRODUCTION_AUDIT_2026-08-25.md`](LIGHTHOUSE_PRODUCTION_AUDIT_2026-08-25.md).

## Prioritized client-side recommendations

| Priority | Recommendation | Rationale | Safe acceptance test |
|---|---|---|---|
| P0 | Keep the server-session hydration pattern for protected role layouts. | It removes duplicate session startup work without weakening server authorization. | Confirm dashboard navigation has no avoidable `/api/auth/session` request and no unauthorized content flash. |
| P0 | Keep first paint immediate on route transitions. | Eliminates a fixed visual delay that users can perceive as a slow page. | Navigate between member, agent, and admin routes and confirm content is visible immediately; check exit animation only where an animation provider is present. |
| P1 | Capture deployed Core Web Vitals and route-specific resource timing for `/`, `/signin`, `/member`, `/agent`, and `/admin`. | Local TTFB cannot expose CDN, browser, serverless cold-start, or real-device costs. | Compare LCP, INP, CLS, hydration time, JS transfer, image transfer, and database/API timing by route. |
| P1 | Profile protected route query waterfalls before adding caching. | Database-backed pages may be slow because of sequential queries or connection cold starts, but caching could make availability data stale. | Add route-level server timing and Prisma query timing in a redacted preview environment, then optimize only the slow query path. |
| P1 | Split below-fold landing sections only after a bundle/Web Vitals baseline. | The monolithic client landing component ships motion and feature code before it is needed. | Preserve server-rendered headings/links and verify mobile navigation, anchor links, SEO HTML, and LCP after any split. |
| P2 | Add a low-data or reduced-motion presentation mode for decorative animations. | Low-power phones and constrained networks benefit from less animation and fewer visual effects. | Verify CTA usability, count values, keyboard focus, and no horizontal overflow at 375×812 and 390×844. |
| P2 | Keep the hero image responsive and audit its encoded size at real phone widths. | `next/image` selects responsive sources, but image decoding can still dominate LCP on slow networks. | Measure image bytes and LCP on a throttled mobile profile before changing quality or priority. |
| P2 | Audit third-party client bundles and request waterfalls. | Mapbox, Pusher, Google auth, and other integrations should not load on routes that do not need them. | Confirm third-party scripts are route-scoped and do not block public/auth interaction. |

## What should not be changed without further evidence

The current evidence does not justify broad database caching, disabling all animations, removing server-side session checks, or reducing security middleware. Those changes could introduce stale marketplace availability, degrade accessibility or product polish, or weaken authorization boundaries. The correct next measurement is a deployed route profile with real browser Web Vitals and server/database timings.

## Reproduction and validation

Run the existing production and type checks with:

```bash
pnpm exec tsc --noEmit
pnpm exec next build
```

Run the full isolated audit with:

```bash
bash scripts/run-final-audit.sh
```

The responsive smoke test remains available with:

```bash
pnpm test:responsive
```

## References

[1]: FINAL_PROJECT_AUDIT.md "NYSC Final Project Audit"
[2]: ../src/app/layout.tsx "NYSC Root Layout"
[3]: ../src/app/App.tsx "NYSC Landing Page"
[4]: ../src/components/layout/PageTransition.tsx "NYSC Page Transition"
[5]: ../src/components/auth/AuthProvider.tsx "NYSC Auth Provider"
