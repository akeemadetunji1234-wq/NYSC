# Hero and Sign-in Loader Asset Findings — 2026-08-31

The user reports that the homepage background appears to occupy only the left half and that the sign-in loading screen should use `NYSC.gif` rather than `LOADER.png`.

Repository findings:

- `src/app/App.tsx` renders the hero with `/campstay-hero.png`, `Image fill`, `sizes="100vw"`, and `object-cover object-center`.
- `public/campstay-hero.png` is a full-frame 1024x1024 JPEG photograph. The bitmap itself is not a split-panel or half-width asset.
- The current hero also applies a strong left-to-right dark-green gradient ending in `to-transparent`; the right side therefore reveals the underlying dark-green section background more strongly. The visible half-dark impression is caused by the overlay/background composition, not by a half-width source image.
- `src/components/ui/CorperSpinner.tsx` is the sign-in loading component and currently renders `/corper-spinner.png` inside the “Finding affordable homes” screen. It does not currently reference `LOADER.png` or `NYSC.gif`.
- `src/components/ui/CorperMarchLoader.tsx` is a separate marketplace data loader and currently renders `/NYSC.gif`.

Required correction:

1. Keep `/campstay-hero.png` as a full-bleed hero image and adjust the overlay/layout so it does not visually read as a left-half image unless that is explicitly intended.
2. Change only `CorperSpinner` to render `/NYSC.gif` for the sign-in “Finding affordable homes” state.
3. Do not use `NYSC.gif` as the generic marketplace `CorperMarchLoader` unless separately requested.
4. Do not delete or repurpose the homepage background asset.
