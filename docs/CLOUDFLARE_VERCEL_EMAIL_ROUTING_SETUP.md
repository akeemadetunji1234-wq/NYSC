# Cloudflare Email Routing + Resend + Vercel Setup

**Domain:** `neatandaffordable.com`  
**Recommended architecture:** Registrar + Cloudflare authoritative DNS + Vercel hosting + Resend transactional email

## Architecture decision

Use Cloudflare as the **DNS and email-routing provider**, not as a reverse proxy in front of Vercel at the beginning. Keep the application hosted on Vercel and set Vercel-related records to **DNS-only** in Cloudflare. Vercel’s current guidance says that a reverse proxy in front of Vercel can reduce traffic visibility, introduce latency, create cache-management problems, and reduce the accuracy of Vercel Bot Protection.[1]

This setup still gives Neat & Affordable Cloudflare-managed DNS and free forwarding while allowing Vercel to see client traffic directly and retain its own certificate, firewall, and bot-detection behavior.

## Part A — Put the domain on Cloudflare DNS

### Step 1: Create or sign in to Cloudflare

Create a Cloudflare account or sign in. Add `neatandaffordable.com` as a website. Cloudflare will scan the existing DNS records if the domain is already configured elsewhere.

### Step 2: Copy existing records before changing nameservers

Before changing nameservers, copy any records you need to preserve, including existing website records, email records, Resend records, verification TXT records, and third-party service records. Do not copy obsolete records or unknown mail-exchange records.

### Step 3: Change nameservers at the registrar

Cloudflare will display two authoritative nameservers. At the domain registrar, replace the registrar’s nameservers with the two Cloudflare nameservers. Do not change the nameservers until the domain is purchased and the registrar account is protected with 2FA and registrar lock.

Wait for Cloudflare to show the domain as **Active**. DNS changes often appear within minutes but can take longer to propagate.

## Part B — Configure Cloudflare Email Routing for support@neatandaffordable.com

Cloudflare Email Routing requires the domain to use Cloudflare DNS.[2]

### Step 1: Open Email Routing

In Cloudflare, go to:

```text
Dashboard → Compute → Email Service → Email Routing
```

Select **Onboard Domain**, choose `neatandaffordable.com`, review the DNS records Cloudflare proposes to add, and select **Done**. Cloudflare’s onboarding creates the routing records required for incoming mail, including root-domain MX records and authentication records.[2]

### Step 2: Add and verify the destination inbox

Go to:

```text
Dashboard → Compute → Email Service → Email Routing → Destination Addresses
```

Add the real inbox that should receive support mail, for example a controlled Gmail, Outlook, Zoho, or other mailbox. Cloudflare will send a verification message. Open that message and select **Verify email address**.

Do not use an unmonitored personal address for security or payment administration. The destination inbox should have a unique password, 2FA, recovery information, and a clear owner.

### Step 3: Create the support rule

Go to the domain’s **Routing Rules** tab and choose **Create routing rule**. Configure:

| Field | Value |
|---|---|
| Email pattern | `support` |
| Domain | `neatandaffordable.com` |
| Action | Send to an email |
| Destination | Your verified support destination inbox |

Save the rule. You can later add `hello`, `security`, and `billing` as separate aliases, but initially route only addresses that have an identified owner.

### Step 4: Test routing

From a different email account, send a test message to `support@neatandaffordable.com`. Confirm delivery to the destination inbox and check spam if it is delayed. Test from an account different from the destination address, because some providers discard messages that appear to originate from the same mailbox receiving the forwarded message.[2]

### Important MX limitation

Cloudflare Email Routing controls the **root domain’s incoming MX records**. Do not simultaneously point the root-domain MX records to Google Workspace, Zoho Mail, Microsoft 365, or another mailbox provider unless you deliberately design a compatible mail architecture. If you later move from Cloudflare forwarding to a full mailbox provider, disable or migrate Email Routing carefully and replace the MX records only after the new provider is verified.

Cloudflare’s routing records are automatically shown in the dashboard. Do not invent the MX priorities or server names from memory. If you also send mail from the root domain through another provider, merge SPF mechanisms into one SPF policy for that exact domain and keep only the intended MX design.

## Part C — Configure Resend for application email

Resend should send application-generated mail from a dedicated subdomain, for example:

```text
updates.neatandaffordable.com
```

### Step 1: Add the sending subdomain in Resend

In Resend, go to **Domains → Add Domain** and enter `updates.neatandaffordable.com`. Resend recommends using a subdomain rather than the root domain for sending reputation separation.[3]

### Step 2: Copy the exact Resend DNS records

Open the Resend domain’s **Records** tab. Copy each generated record exactly into Cloudflare’s **DNS → Records** page.

The actual DKIM hostname, public key, verification token, and SPF/MX values are unique to the Resend account and domain. They cannot be safely supplied in advance. The record types may include TXT, CNAME, and MX records depending on Resend’s current configuration.

| Cloudflare field | What to enter |
|---|---|
| Type | Exactly the type Resend displays |
| Name | Exactly the host Resend displays, adjusted only for the DNS dashboard’s automatic domain-appending behavior |
| Target/content | Exactly the value Resend displays |
| Proxy status | **DNS-only**; do not proxy email DNS records |
| TTL | Auto unless Resend or your DNS provider specifies otherwise |

Do not paste the Resend API key into DNS. Only public verification/authentication records belong in DNS.

### Step 3: Avoid duplicate SPF records

There must be only one SPF policy for `updates.neatandaffordable.com`. If Resend supplies an SPF TXT record for that subdomain, do not add a second independent `v=spf1` record there. If another provider also sends from the same subdomain, merge mechanisms according to both providers’ instructions and remain within SPF lookup limits.

The root domain and the Resend sending subdomain can have separate SPF policies:

```text
neatandaffordable.com                 → Cloudflare forwarding or human-mail sender policy
updates.neatandaffordable.com         → Resend sending policy
```

### Step 4: Verify Resend

Return to Resend and select **Verify**. Correct DNS records often verify within approximately 15 minutes, but propagation can take up to 72 hours.[3]

Test verification emails, password resets, booking confirmations, saved-search alerts, security alerts, and payment receipts. Inspect the received headers for SPF, DKIM, and DMARC passing.

## Part D — Add DMARC

Create one TXT record at:

```text
_dmarc.neatandaffordable.com
```

Start with monitoring:

```text
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@neatandaffordable.com; pct=100
```

The `dmarc@neatandaffordable.com` mailbox or reporting service must exist. Start at `p=none`, review reports and real message headers, then move to `p=quarantine`, and finally `p=reject` only after every legitimate sender passes. Resend recommends this gradual rollout.[4]

If Cloudflare Email Service or another provider creates a DMARC record automatically, do not create a second DMARC record. Edit or manage the existing one according to the provider’s dashboard.

## Part E — Add the custom domain to Vercel

### Step 1: Add the domain in Vercel

In the Vercel dashboard:

```text
Select the NYSC project → Settings → Domains → Add Domain
```

Enter:

```text
neatandaffordable.com
```

Vercel may prompt you to add `www.neatandaffordable.com` as well. Add both if you want both forms to work, then choose one canonical domain and configure the other to redirect to it.[5]

### Step 2: Copy Vercel’s exact DNS instructions

Vercel displays the required DNS record for the project. For an apex domain it normally uses an `A` record; for a subdomain it uses a `CNAME` record. Use the exact value displayed in the Vercel project, because Vercel may provide a project-specific CNAME target.[5]

A typical shape is:

| Host | Type | Value | Cloudflare proxy |
|---|---|---|---|
| `@` | `A` | The exact Vercel apex value shown in the dashboard | DNS-only |
| `www` | `CNAME` | The exact Vercel CNAME target shown in the dashboard | DNS-only |

Do not proxy these records through Cloudflare at first. Do not add Cloudflare Email Routing MX records to the Vercel host records, and do not point MX records at Vercel.

### Step 3: Create the records in Cloudflare

Open:

```text
Cloudflare → neatandaffordable.com → DNS → Records → Add record
```

Create the Vercel A/CNAME records exactly as displayed. If Cloudflare automatically appends the domain, enter only the host portion requested by the dashboard. Save the records.

### Step 4: Verify in Vercel

Return to Vercel’s **Settings → Domains** page and select **Refresh** or wait for automatic verification. Once Vercel reports the domain as configured, visit both the apex and `www` forms over HTTPS.

Verify:

| Check | Expected result |
|---|---|
| `https://neatandaffordable.com` | Loads the NYSC application over HTTPS |
| `https://www.neatandaffordable.com` | Loads or redirects to the chosen canonical host |
| Certificate | Valid for the custom domain |
| Login/session | Cookies and OAuth callbacks use the correct HTTPS host |
| Email links | Verification/reset links use the intended canonical host |
| API/webhooks | Paystack, Resend, and other callbacks use exact configured URLs |
| Caching | Authenticated pages and sensitive API responses are not publicly cached |

Do not change `NEXTAUTH_URL`, callback URLs, CORS allowlists, or email-link base URLs until the canonical host is selected and DNS/HTTPS are verified. Then update them deliberately in the correct Vercel environment variables and rerun the relevant security tests.

## Why use Cloudflare and Vercel together?

| Benefit | Explanation |
|---|---|
| Separation of responsibilities | Vercel runs the Next.js application; Cloudflare manages authoritative DNS and optional email routing. |
| Branded support mail | Cloudflare can forward `support@neatandaffordable.com` to an existing inbox without requiring a full mailbox plan. |
| Transactional-email separation | Resend can send from a dedicated subdomain while human support mail stays on the root domain. |
| Operational flexibility | The domain can remain registered with one registrar while DNS, hosting, and mail services are managed independently. |
| Easier future migration | DNS records can be changed without moving the application or email service at the same time. |
| Layered resilience | A registrar outage does not automatically stop an already propagated site or mail flow, although DNS management and renewal access still matter. |

## Tradeoffs and recommended boundary

Using Cloudflare only for DNS and Email Routing is low complexity and compatible with Vercel. Putting Cloudflare’s reverse proxy in front of Vercel is a different decision. Vercel currently discourages that design because it can obscure traffic signals, reduce Vercel firewall and bot-detection effectiveness, add latency, and create cache-management issues.[1]

For Neat & Affordable’s initial launch, use:

```text
Registrar → domain ownership and renewal
Cloudflare → authoritative DNS and Email Routing
Vercel → application hosting, HTTPS, and Vercel firewall/bot controls
Resend → transactional application email
```

Keep Vercel and email DNS records **DNS-only** in Cloudflare. Reconsider Cloudflare proxying only after a documented performance and security review, with authenticated-route caching disabled and end-to-end HTTPS confirmed.

## References

[1]: https://vercel.com/kb/guide/cloudflare-with-vercel "Vercel — Should I use Cloudflare in front of Vercel?"

[2]: https://developers.cloudflare.com/email-service/get-started/route-emails/ "Cloudflare — Route emails"

[3]: https://resend.com/docs/add-a-domain "Resend — Add and verify a domain"

[4]: https://resend.com/docs/dashboard/domains/dmarc "Resend — Implementing DMARC"

[5]: https://vercel.com/docs/domains/working-with-domains/add-a-domain "Vercel — Adding and configuring a custom domain"
