# Security and monitoring sources

## Vercel Cron Jobs

Source: https://vercel.com/docs/cron-jobs/manage-cron-jobs

Vercel recommends a random `CRON_SECRET` of at least 16 characters. Vercel sends the value as an `Authorization: Bearer ...` header when invoking configured cron routes. Cron delivery is best-effort, Vercel does not automatically retry failed invocations, and cron execution logs are available in the Vercel dashboard. The documentation also notes that Hobby-plan schedules are limited to once per day.

## Next.js Content Security Policy

Source: https://nextjs.org/docs/app/guides/content-security-policy

Next.js documents CSP as a defense against XSS, clickjacking, and code injection. For applications that do not require per-request nonces, Next.js supports setting a static CSP through `next.config.js`; nonce-based CSP requires dynamic rendering and can reduce caching and performance.

## Vercel Sensitive Environment Variables

Source: https://vercel.com/docs/environment-variables/sensitive-environment-variables

Vercel sensitive environment variables are non-readable after creation and are intended for API keys and other secrets in Production and Preview. Existing variables must be removed and re-added to mark them Sensitive. Vercel redacts long sensitive values from build logs and records masking events without exposing the value.
