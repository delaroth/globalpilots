# Business email setup (Cloudflare + Resend + Gmail)

Use this until Google Workspace is worth paying for (target: January 2027).
Inbound mail is Cloudflare Email Routing. Outbound mail is Resend.

Project inbox: `movearoundtheglobe@gmail.com` (Cloudflare destination for business addresses).
Personal Gmail can stay a separate destination later if `levi@` should not mix with provider mail.

## Address plan

Catch-all stays **disabled**. Add only the addresses below.

### Create next (same destination as `api@`)

| Address | Situation | Gmail Send mail as |
| --- | --- | --- |
| `hello@globepilots.com` | Public contact, contact page, general inbound | Yes |
| `notifications@globepilots.com` | Site-generated mail (alerts, welcome, password reset). Route it so replies and bounces are visible | No (Resend API sends this) |
| `privacy@globepilots.com` | Already printed on `/privacy` | No |
| `legal@globepilots.com` | Already printed on `/terms` | No |

### Add when that situation starts

| Address | Situation | Gmail Send mail as |
| --- | --- | --- |
| `partnerships@globepilots.com` | Balkan hotels, GetYourGuide, Agoda, local operators | Yes |
| `billing@globepilots.com` | Vercel, Resend, Stripe, Cloudflare invoices | No |
| `levi@globepilots.com` | Founder identity. Route to personal Gmail if you want it off the project mailbox | Yes |

### Optional silent routes (legacy copy on the site)

`support@`, `alerts@`, `contact@` — forward to the same project Gmail so old links do not bounce. Do not put these on new forms or applications.

Do not add `info@`, `admin@`, `sales@`, `noreply@`, or `press@` unless a real use appears. Extra public inboxes split mail and look less focused.

## API keys

Resend key **names** are labels only. They do not have to match Vercel / `.env` variable names. What matters is which **token value** you paste where, and the permission on that key.

| Resend name | Permission | Paste this token into | Used for |
| --- | --- | --- | --- |
| `GlobePilots` | Full access | Vercel + `.env.local` variable `RESEND_API_KEY` (Production, Preview, and Development) | Site mail from `notifications@globepilots.com` |
| `Gmail_Send_As` | Sending access | Gmail SMTP password field only (password manager is fine) | Gmail “Send mail as” `api@` / `hello@` / `levi@` |
| `Onboarding` | Sending access | Nowhere new. Revoke it after the two keys above work | Old leftover from Resend signup |

The Next.js app only reads `RESEND_API_KEY`. It never reads a `RESEND_GMAIL_SEND_AS_API_KEY` variable, so that send-only token does not belong in Vercel.

Vercel checklist:

1. `RESEND_API_KEY` must be the **GlobePilots** (full access) token, on **Production + Preview + Development**. Development-only will not send mail on the live site.
2. Remove `RESEND_GMAIL_SEND_AS_API_KEY` from Vercel once the value is saved in a password manager.
3. Replace `RESEND_API_KEY` in `.env.local` with the GlobePilots token. The previous local value is rejected by Resend (`API key is invalid`).

## Current state (checked 2026-09-06)

- Cloudflare zone is active. Nameservers: `fatima.ns.cloudflare.com`, `ignacio.ns.cloudflare.com`.
- Apex resolves to Vercel (`216.198.79.1`) — grey-cloud is in effect.
- Email Routing MX and SPF are live. Catch-all is Active + Drop.
- Forwards to `movearoundtheglobe@gmail.com`: `api@`, `hello@`, `notifications@`, `privacy@`, `legal@`.
- Resend sending records are in DNS (`send` MX/TXT, `resend._domainkey`).
- Gmail Send mail as for `api@globepilots.com` on `movearoundtheglobe@gmail.com` is confirmed.

## 1. Grey-cloud the Vercel records

Open [Cloudflare DNS for globepilots.com](https://dash.cloudflare.com/?to=/:account/globepilots.com/dns).

For every record that points at Vercel (apex `A`/`AAAA`/`CNAME`, and `www`):

1. Click the record.
2. Set proxy status to **DNS only** (grey cloud).
3. Save.

Leave Email Routing MX/TXT records that Cloudflare adds later on **DNS only** as well. Do not proxy mail records.

Why: Cloudflare in front of Vercel hides visitor IPs from Vercel’s bot detection and adds a second CDN. The site should keep talking to Vercel directly.

Confirm afterwards with:

```text
nslookup globepilots.com 1.1.1.1
```

You want Vercel IPs (currently in the `216.198.79.x` / `64.29.17.x` range, or a `*.vercel-dns*.com` CNAME), not `104.21.*` / `172.67.*`.

## 2. Enable Cloudflare Email Routing

1. Open [Email Routing](https://dash.cloudflare.com/?to=/:account/email-service/routing).
2. Onboard `globepilots.com` and let Cloudflare add the MX + SPF + DKIM records.
3. Add destination address `movearoundtheglobe@gmail.com` and click the verification link Cloudflare sends.
4. `api@` is already Active. Create the remaining custom addresses from the plan above, all forwarding to that Gmail.
5. Confirm **Catch-all** is off.

Cloudflare will add root MX records similar to:

```text
MX  @  route1.mx.cloudflare.net
MX  @  route2.mx.cloudflare.net
MX  @  route3.mx.cloudflare.net
TXT @  "v=spf1 include:_spf.mx.cloudflare.net ~all"
```

Do not add Resend receiving/MX on the root domain. That would fight Cloudflare for inbound mail.

## 3. Verify globepilots.com in Resend

1. Open [Resend Domains](https://resend.com/domains) and add `globepilots.com` if it is not already there.
2. Prefer **Sign in to Cloudflare** so Resend writes its own records.
3. Leave Resend **Receiving** off for the root domain.
4. Expected Resend records (all DNS only):

   - `MX send` → Amazon SES feedback host from the Resend dashboard
   - `TXT send` → `v=spf1 include:amazonses.com ~all`
   - `TXT resend._domainkey` → Resend DKIM value
5. Click **Verify DNS Records** and wait until the domain is Verified.

Root SPF (Cloudflare forwarding) and `send` SPF (Resend bounce domain) can coexist because they live on different names.

Optional DMARC on `_dmarc`:

```text
v=DMARC1; p=quarantine; rua=mailto:hello@globepilots.com
```

Only add this after Email Routing and Resend DKIM are verified.

## 4. Create a separate Resend API key for Gmail

1. Open [Resend API Keys](https://resend.com/api-keys).
2. Create a key named `gmail-send-as`.
3. Permission: **Sending access** only, domain `globepilots.com`.
4. Store it in a password manager. Do **not** put it in Vercel or `.env.local`. The site keeps using `RESEND_API_KEY`.

## 5. Gmail “Send mail as”

In Gmail: Settings → See all settings → **Accounts and Import** → **Send mail as** → **Add another email address**.

Repeat for `levi@`, `api@`, and `hello@`:

| Field | Value |
| --- | --- |
| Name | Levi / GlobePilot API / GlobePilot (match the address) |
| Treat as an alias | Checked |
| SMTP server | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` (the literal word) |
| Password | the `gmail-send-as` API key |
| Secured connection | SSL |

Gmail labels already created:

- `GlobePilots/Levi`
- `GlobePilots/API`
- `GlobePilots/Hello`
- `GlobePilots/Notifications`
- `GlobePilots/Legal`

Add filters (Settings → Filters and Blocked Addresses):

| Matches | Apply label |
| --- | --- |
| `to:levi@globepilots.com` | GlobePilots/Levi |
| `to:api@globepilots.com` | GlobePilots/API |
| `to:hello@globepilots.com` OR `to:support@globepilots.com` | GlobePilots/Hello |
| `to:notifications@globepilots.com` OR `to:alerts@globepilots.com` OR `to:contact@globepilots.com` | GlobePilots/Notifications |
| `to:privacy@globepilots.com` OR `to:legal@globepilots.com` | GlobePilots/Legal |

## 6. Test

Do these from a mailbox that is **not** the Gmail destination (a second Gmail, or the provider’s test form). Sending from the same Gmail that receives the forward often gets dropped.

1. Email `hello@globepilots.com` → arrives in Gmail, labeled Hello.
2. Email `api@globepilots.com` → arrives, labeled API.
3. Reply from Gmail as `hello@globepilots.com`. The recipient should see `hello@`, not the Gmail address.
4. Submit the site contact form. It should land on `hello@` with From `notifications@globepilots.com`.
5. Trigger a password-reset or welcome email and confirm From is `notifications@globepilots.com`.

## App wiring

The site sends automated mail from `notifications@globepilots.com` via `RESEND_API_KEY`. Public contact stays `hello@globepilots.com` (`CONTACT_EMAIL`).
