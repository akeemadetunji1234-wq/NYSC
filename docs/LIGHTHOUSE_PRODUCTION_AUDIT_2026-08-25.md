# Live Lighthouse Production Audit

**Project:** `akeemadetunji1234-wq/NYSC`  
**Production URL:** [https://nysc-mu.vercel.app/](https://nysc-mu.vercel.app/)  
**Deployment:** Vercel production deployment `dpl_DbcsC9Q8nUvMTpBpWzuYyjwonSU6`, commit `27cf745`  
**Date:** 2026-08-25

## Executive conclusion

The live Lighthouse run found and helped isolate a real first-paint defect. Before the final fix, the production home and sign-in routes returned `NO_FCP` because the app-wide `template.tsx` and top-level auth motion cards server-rendered content at `opacity: 0`. The deployment now uses `initial={false}` for those first-paint wrappers. Post-fix runs produced normal paint metrics and scored **0.99 Performance on mobile home**, **0.99 Performance on mobile sign-in**, and **1.00 Performance on desktop home** [1] [2] [3].

The result does not indicate a persistent production document-server bottleneck. Root-document latency was approximately **20 ms** on mobile home, **30 ms** on mobile sign-in, and **10 ms** on desktop home. The remaining mobile cost is mostly the landing page’s full-viewport hero image, font transfer, client-side landing-page hydration, and decorative motion. The sign-in route is substantially lighter than the home route.

## Measurements

| Route and profile | Performance | FCP | LCP | Speed Index | TBT | CLS | Root-document latency | DOM elements |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` mobile | 0.99 | 1.4 s | 2.0 s | 2.7 s | 0 ms | 0 | 20 ms | 341 |
| `/signin` mobile | 0.99 | 1.1 s | 1.9 s | 2.6 s | 0 ms | 0 | 30 ms | 45 |
| `/` desktop | 1.00 | 0.3 s | 0.3 s | 0.5 s | 0 ms | 0 | 10 ms | 341 |

The supporting category scores were as follows:

| Run | Accessibility | Best Practices | SEO |
|---|---:|---:|---:|
| `/` mobile | 0.87 | 0.93 | 1.00 |
| `/signin` mobile | 0.95 | 0.93 | 1.00 |
| `/` desktop | 0.95 | 0.93 | 1.00 |

These are lab measurements from a single live run per profile, not field Web Vitals. They should be repeated from representative Nigerian mobile networks and devices before setting a user-facing performance SLO.

## Confirmed bottleneck and fix

The initial live Lighthouse run failed with `NO_FCP` on the production home route. The production HTML contained a top-level wrapper with `style="opacity:0;transform:translateY(10px)"`. The source was `src/app/template.tsx`, whose Motion wrapper used an opacity-zero initial state. The sign-in route separately contained an opacity-zero initial state in `SignIn.tsx`; registration and recovery had the same pattern.

The fix changed the app template and top-level sign-in, sign-up, forgot-password, and reset-password cards to `initial={false}`. This preserves the content’s immediate first paint and leaves later exit/interaction animation behavior available. The post-fix production home and sign-in runs completed without `NO_FCP` [1] [2].

## Remaining measured opportunities

The post-fix mobile home run transferred approximately **242 KB** across **21 requests**. The largest reported categories were approximately **134 KB of fonts**, **65 KB of hero image**, **31 KB of CSS**, and **11 KB of HTML**. The page contained **341 DOM elements** and a long approximately 9,144-pixel document in the mobile run. The sign-in page contained only **45 DOM elements**, confirming that its remaining load is not caused by an oversized auth DOM.

The safe next optimization is to measure real-device image and font costs before changing quality or loading policy. The hero image is already responsive and preloaded by Next Image. Below-the-fold landing sections and their decorative motion still ship from one large client component; splitting or reducing those sections should be evaluated against LCP, anchor navigation, SEO HTML, and mobile accessibility rather than applied blindly. Protected routes should receive route-level server timing before database caching or query changes are introduced.

Accessibility remains the main category gap in these runs: mobile home scored **0.87**, while sign-in and desktop home scored **0.95**. The Lighthouse JSON files should be opened in the Lighthouse report viewer to inspect the exact failing audits before making accessibility changes.

## Reproduction commands

```bash
npx --yes lighthouse https://nysc-mu.vercel.app/ \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json \
  --output-path=docs/audit-assets/lighthouse/production-mobile-after-template-fix.json \
  --chrome-flags='--headless --no-sandbox --disable-dev-shm-usage'

npx --yes lighthouse https://nysc-mu.vercel.app/signin \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json \
  --output-path=docs/audit-assets/lighthouse/production-signin-mobile-after-fix.json \
  --chrome-flags='--headless --no-sandbox --disable-dev-shm-usage'
```

## References

[1]: audit-assets/lighthouse/production-mobile-after-template-fix.json "Live Lighthouse production home mobile JSON"

[2]: audit-assets/lighthouse/production-signin-mobile-after-fix.json "Live Lighthouse production sign-in mobile JSON"

[3]: audit-assets/lighthouse/production-desktop-after-template-fix.json "Live Lighthouse production home desktop JSON"

[4]: PERFORMANCE_BOTTLENECK_ANALYSIS.md "NYSC performance bottleneck analysis"

[5]: https://developer.chrome.com/docs/lighthouse/overview "Chrome Lighthouse documentation"
