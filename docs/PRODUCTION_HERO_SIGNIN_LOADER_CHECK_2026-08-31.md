# Production Hero and Sign-in Loader Check — 2026-08-31

The corrected commit `8a66e488a182dd90a6388b91f326f82cef0eba13` deployed to Vercel production deployment `dpl_ByJGQKnraWD5SxEj2aP4UE1Mn8Gu` with `readyState: READY` and alias `https://nysc-mu.vercel.app/`.

The connected Chromium browser loaded the production homepage successfully. The hero background is visually full-bleed across the viewport after replacing the Next Image fill block with an explicit CSS `background-image`, `background-size: cover`, and `background-position: center` treatment.

The sign-in loader was corrected in source so `CorperSpinner` now renders `/NYSC.gif` without cropping, while the separate `CorperMarchLoader` no longer references `NYSC.gif` and remains a CSS marketplace loader.

The sign-in overlay itself was not submitted with real credentials during this check, so the loading state was validated by source/build inspection rather than a real login attempt. No Firefox, Safari, or Edge browser engines were available for automated checks in this environment.
