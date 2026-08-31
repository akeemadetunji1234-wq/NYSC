# SPF, DKIM, and DMARC Setup for neatandaffordable.com

**Recommended sender:** Resend  
**Recommended sending domain:** `updates.neatandaffordable.com` or `mail.neatandaffordable.com`  
**Scope:** Transactional application email such as verification, password reset, booking, security, and payment notifications

## Important rule

Do not guess or reuse SPF/DKIM values from another domain. Resend generates domain-specific records in its dashboard. Copy those values exactly after adding the chosen sending subdomain. Resend recommends sending from a subdomain rather than the root domain to separate transactional sending reputation from human mail.[1]

## 1. Buy the domain and choose one DNS manager

After purchasing `neatandaffordable.com`, identify where its authoritative DNS records are managed. This may be the registrar, Cloudflare, or another DNS provider. Add records in **only one authoritative DNS dashboard**. If the registrar uses Cloudflare nameservers, edit DNS in Cloudflare rather than in the registrar’s old DNS panel.

Keep the domain registrar account protected with a unique password, two-factor authentication, registrar lock, recovery codes, and auto-renewal reminders. Do not send registrar passwords or recovery codes through email or chat.

## 2. Add the sending domain in Resend

In Resend, open **Domains**, choose **Add Domain**, and add a sending subdomain such as:

```text
updates.neatandaffordable.com
```

A subdomain is preferable for verification emails, security alerts, booking notifications, and payment receipts. Resend will display a **Records** section containing the exact DNS records required for that domain. Select a sending region close to the majority of recipients, then copy each record exactly.[1]

## 3. Add Resend’s generated records

The record names and values below are examples of the record types to expect. The actual hostnames, tokens, and values must come from the Resend dashboard.

| Purpose | Type | Host/name | Value | Source |
|---|---|---|---|---|
| Domain verification or SPF authorization | `TXT` or provider-specified record | Exactly as displayed by Resend | Exactly as displayed by Resend | Resend Records tab |
| DKIM public key or delegated DKIM record | Usually `CNAME` or `TXT` | Exactly as displayed by Resend | Exactly as displayed by Resend | Resend Records tab |
| Resend return-path/bounce handling | Often `MX` and/or `TXT` | Exactly as displayed by Resend | Exactly as displayed by Resend | Resend Records tab |

Some DNS dashboards automatically append the root domain to a host field. For example, if Resend displays `send.updates.neatandaffordable.com`, the DNS provider may require only `send` or `send.updates`, not the full name. Follow the dashboard’s field format and confirm the resulting fully qualified name before saving.

## 4. Avoid multiple SPF records

A domain or subdomain must not have multiple independent SPF TXT policies. If another provider already sends mail from the **same exact domain**, merge the authorized mechanisms into one SPF record rather than creating a second `v=spf1` record. Resend’s generated instructions take priority for the Resend sending subdomain.

For example, do not create two records like:

```text
v=spf1 include:provider-one.example ~all
v=spf1 include:provider-two.example ~all
```

If human mail is hosted on the root domain and Resend sends from a dedicated subdomain, keep their SPF policies separate:

```text
neatandaffordable.com                 -> mailbox provider SPF
updates.neatandaffordable.com         -> Resend SPF instructions
```

The exact SPF include must come from the provider. Do not substitute a remembered value.

## 5. Add one DMARC policy for the organizational domain

DMARC is a TXT record at `_dmarc.neatandaffordable.com`. Resend recommends starting with monitoring, confirming that all legitimate messages pass, and then moving to quarantine or reject.[2]

Start with this staged policy:

```text
Host/name: _dmarc
Type: TXT
Value: v=DMARC1; p=none; rua=mailto:dmarc@neatandaffordable.com; pct=100
```

The `dmarc@neatandaffordable.com` address must exist or be configured to receive reports. If the provider requires an external report destination, use the provider’s documented authorization process instead of inventing one.

After verifying all legitimate sources for at least one monitoring period, tighten gradually:

```text
v=DMARC1; p=quarantine; rua=mailto:dmarc@neatandaffordable.com; pct=100
```

Then, when legitimate mail consistently passes and no required sender is missing:

```text
v=DMARC1; p=reject; rua=mailto:dmarc@neatandaffordable.com; pct=100
```

Do not move directly to `p=reject` if you have not checked mailbox replies, forwarding behavior, support tools, payment notifications, and any other service that sends as the domain. A strict policy can block legitimate mail that has not been configured correctly.

## 6. Verify in Resend and externally

Return to the Resend domain dashboard and choose **Verify** or refresh verification. Resend says correct records often verify within approximately 15 minutes, although DNS propagation can occasionally take up to 72 hours.[1]

Verify the records from outside the DNS dashboard using tools such as Resend’s DNS checker, `dig`, or a reputable DNS inspection service. Safe examples are:

```text
dig TXT _dmarc.neatandaffordable.com
dig TXT updates.neatandaffordable.com
dig CNAME <the-DKIM-hostname-shown-by-Resend>
```

Do not place API keys, mailbox passwords, or secret tokens in commands that may be stored in shell history. DNS records themselves are public; Resend’s generated DKIM public record is not a secret, but the Resend API key is secret and must remain server-side.

Send controlled test messages to Gmail, Outlook, and another mailbox provider. Inspect the received message’s authentication results and confirm:

```text
dkim=pass
authenticated domain aligns with the From domain
spf=pass
dmarc=pass
```

Also test the actual application messages: email verification, password reset, booking confirmation, saved-search alert, security alert, and premium-payment receipt. Confirm that raw tokens, passwords, payment secrets, and internal stack traces do not appear in message bodies, subjects, URLs, or logs.

## 7. Configure the application safely

Set the application’s verified sender to a controlled address such as:

```text
Neat & Affordable <no-reply@updates.neatandaffordable.com>
```

Keep the Resend API key only in server-side environment variables. It must not be prefixed with `NEXT_PUBLIC_`, committed to Git, placed in frontend code, or printed in logs. Use separate test and production keys, and restrict the production key to the smallest required permission set.

The application should send only from a domain that Resend has verified. The web client should never be allowed to choose an arbitrary From address. Payment receipts should be generated only after server-side Paystack verification or a valid signed webhook, not merely because a browser callback says payment succeeded.

## 8. Common problems

| Symptom | Likely cause | Safe fix |
|---|---|---|
| Resend cannot verify SPF/DKIM | Wrong host field, missing record, DNS propagation, or editing a non-authoritative DNS panel | Compare the fully qualified DNS name and value with Resend; wait for propagation; check nameservers. |
| SPF passes but DMARC fails | SPF is not aligned with the visible From domain, or DKIM is missing/aligned incorrectly | Prefer Resend DKIM on the sending subdomain and inspect the message authentication results. |
| Messages go to spam | New domain reputation, missing DMARC, content quality, bounces, or high complaint rate | Authenticate the domain, use a dedicated transactional subdomain, suppress invalid recipients, and monitor bounces. |
| Legitimate support replies stop arriving | MX records point to Resend or another provider instead of the human mailbox provider | Keep human-mail MX records with the mailbox provider; use Resend’s receiving features only if intentionally configured. |
| More than one SPF record exists | Multiple providers added independent `v=spf1` TXT records | Merge them into one policy for that exact domain/subdomain. |
| DMARC reports create a new inbox problem | `rua` address does not exist or receives large XML reports | Create a monitored reporting mailbox or use a reputable DMARC reporting service. |

## Recommended final architecture

Use `neatandaffordable.com` for the brand and human addresses, such as `support@neatandaffordable.com`. Use `updates.neatandaffordable.com` as Resend’s transactional sending domain. Keep mailbox-provider MX records on the root domain and Resend’s generated records on the transactional subdomain. Start DMARC at `p=none`, monitor, then move to `quarantine` and eventually `reject` only after all legitimate sources are confirmed.

## References

[1]: https://resend.com/docs/add-a-domain "Resend — Add and verify a domain"

[2]: https://resend.com/docs/dashboard/domains/dmarc "Resend — Implementing DMARC"
