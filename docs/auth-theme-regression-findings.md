# Authentication theme regression findings

## Reproduction

A local browser reproduction was run from `/` to `/signin` with `localStorage.theme = "dark"`. Before the final route-local surface adjustment, the sign-in inputs resolved to white in the ordinary session, but the root document did not expose the expected `data-auth-theme` marker consistently during client navigation. When a dark root class was forced in the live session, the auth input and card tokens remained light while the document body background resolved to a dark color. This demonstrated that component-level light tokens alone were insufficient to guarantee a light full-page auth surface.

## Corrective implementation

The corrective change adds a full-viewport `[data-auth-surface]` wrapper with explicit light background and text classes, light semantic CSS-token overrides, and `color-scheme: light`. The route-aware root `ThemeProvider` recognizes `/signin`, `/signup`, `/forgot-password`, `/reset-password`, and `/verify-google` as authentication routes. Each of those routes now mounts the shared `AuthTheme` boundary, while the sign-out helper continues to prepare light mode before navigation. The implementation does not overwrite the persisted dashboard preference; leaving an auth route allows the dashboard theme to be resolved again.

## Verification evidence

The cache-busted direct route verification at `/signin?themefix=1` showed the updated wrapper active with `class="block min-h-screen bg-gray-50 text-gray-900"`, a light computed wrapper background, white input backgrounds, and a persisted `localStorage.theme = "dark"`.

The exact homepage navigation path was then exercised in the live local browser: the homepage `Sign In` link was clicked while the dark preference remained stored. The resulting `/signin` screen reported a mounted `data-auth-surface`, a light computed surface background, `--card: #fff`, white input background, and a white document body. The visible sign-in form was therefore light rather than dark.

The enhanced 375×812 DevTools Protocol smoke test repeats this regression scenario automatically. It sets the dark preference on the homepage, reloads, navigates to `/signin`, and fails unless the auth surface, light card token, and white input background are present. The assertion passed with `surfaceBackground = lab(98.2596 -0.247031 -0.706708)`, `surfaceCard = #fff`, and `inputBackground = rgb(255, 255, 255)`. The same smoke run reported no horizontal overflow on all nine tested public, auth, protected-entry, and profile/settings routes.

The production build and complete 12-check local audit also passed after the change. The remaining deployment limitation is that the Vercel preview’s anonymous `/signin` route may be intercepted by project SSO, so local computed-style verification is the authoritative visual evidence unless an authenticated preview session is available.
