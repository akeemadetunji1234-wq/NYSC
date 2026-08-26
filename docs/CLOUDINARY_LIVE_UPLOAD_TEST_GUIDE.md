# Live Cloudinary Upload Test Guide

Use this guide after the Vercel deployment containing the Cloudinary variables is `READY`.

## Safety prerequisites

Use a disposable verified agent account and a synthetic test image. Do not use a real tenant’s image, do not paste an API Key or API Secret into the browser, and do not click **Save Changes** or **Publish** during this test. The upload control sends the image directly to Cloudinary, so a successful test creates a provider asset even if the property form is never submitted.

Confirm in Vercel **Settings → Environment Variables → Production** that these two names exist:

```text
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
```

The preset should be **Unsigned**, resource type **Image**, and restricted to the intended formats, size, folder, and transformations. Never add `CLOUDINARY_API_SECRET` or a private signing credential as a `NEXT_PUBLIC_` variable.

## Test the new-property flow

1. Open [https://nysc-mu.vercel.app/](https://nysc-mu.vercel.app/) and sign in with the disposable verified agent account.
2. Open **Agent → Properties → Add New Property**.
3. Complete the required wizard fields only far enough to reach **Property Photos**. Do not submit the form.
4. Select a synthetic `.txt` file. Confirm the inline message says it must be a JPG, PNG, or WEBP image smaller than 10 MB.
5. Select a synthetic JPG larger than 10 MB. Confirm the inline size/type message appears and no Cloudinary request is sent.
6. Select one small synthetic JPG, PNG, or WEBP. Confirm **Uploading pictures...** appears while the request is in progress, then confirm a preview appears and the image count increases.
7. Select enough additional valid files to exceed five total images. Confirm the inline five-image limit appears and the input does not add more files.
8. Confirm that only **Property Photos** is shown. There should be no virtual-tour video control.
9. Stop the test without clicking the final save or publish action.

## Test the edit-property flow

1. Open an existing disposable/test property owned by the disposable agent and choose **Edit**.
2. In **Property Media**, repeat the invalid TXT, oversized image, and valid image checks above.
3. Confirm the edit form uses the same five-image limit, JPG/PNG/WEBP allowlist, 10 MB limit, inline errors, and `Uploading pictures...` status.
4. Remove a preview and confirm the image count decreases.
5. Stop without clicking **Save Changes** unless you intentionally want to persist the test property update.

## Optional browser verification

Open the browser developer tools **Network** panel before selecting a valid file. The request should be a `POST` to:

```text
https://api.cloudinary.com/v1_1/<cloud-name>/image/upload
```

The request should contain the file and `upload_preset`. Do not copy or share request headers, cookies, API credentials, or any secret values. A successful response should contain a `secure_url`, which the page uses only for the preview until the surrounding form is saved.

## Interpreting failures

| Symptom | Likely cause | Action |
|---|---|---|
| “Image upload is not configured yet” | The public variables were not included in the deployed build or are attached to the wrong Vercel environment. | Confirm both names under **Production**, redeploy, and hard-refresh the site. |
| 400 from Cloudinary | Preset name, resource type, format, size, or transformation restriction rejected the request. | Review the unsigned preset settings; do not add the API Secret to the browser. |
| 401 or 403 | The preset is signed, disabled, restricted by an invalid rule, or the Cloudinary account rejected the request. | Recheck that the preset is enabled and unsigned; inspect Cloudinary’s upload-preset settings. |
| Preview never appears | The provider response was not successful or did not include `secure_url`. | Check the sanitized inline error and the provider response status; do not retry with private credentials. |
| Upload succeeds but saving fails | Cloudinary upload and application database update are separate steps. | Check the application’s server-side authorization and database logs; do not repeatedly upload duplicates. |

## Cleanup

If a provider asset was created, remove it from Cloudinary using the Cloudinary dashboard or a controlled server-side cleanup process. Do not attempt deletion from browser code with an API Secret. Delete any disposable test property and test account from the isolated environment, then verify no real listing was created.
