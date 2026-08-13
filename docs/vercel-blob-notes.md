# External implementation notes

## Vercel Blob server uploads

Source: [Vercel Blob server uploads](https://vercel.com/docs/vercel-blob/server-upload)

The official documentation states that the `@vercel/blob` package supports server uploads through `put(pathname, body, options)`, with explicit `access: "public"` or `access: "private"`. Connected Vercel Blob stores provide `BLOB_STORE_ID` and `VERCEL_OIDC_TOKEN`; `BLOB_READ_WRITE_TOKEN` is available as a fallback for local or non-Vercel environments. Vercel server uploads are subject to the platform request-body limit, so this application keeps its image limit below that threshold.

Source: [Vercel Blob SDK](https://vercel.com/docs/vercel-blob/using-blob-sdk)

The SDK resolves credentials through explicit token, OIDC credentials paired with a store ID, or `BLOB_READ_WRITE_TOKEN`. The upload implementation therefore sends validated image bytes to Blob on Vercel and refuses ephemeral local filesystem writes when Vercel Blob credentials are missing.
