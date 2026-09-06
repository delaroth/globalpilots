# PostHog setup

GlobePilot loads PostHog only after a visitor chooses **Allow analytics**. The
integration is inert when its environment variables are absent, so it is safe
to deploy before creating the PostHog project.

## 1. Create the project

GlobePilot uses PostHog Cloud **EU** (project ID `267325`). Copy the
**project token** (`phc_...`) from Project Settings, not a personal API key.

## 2. Configure Vercel

Add these variables to Production (and Preview if you want to test there):

```text
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
NEXT_PUBLIC_POSTHOG_UI_HOST=https://eu.posthog.com

These three are already in local `.env.local`. Add the same values in Vercel
for Production and Preview, then redeploy. Do not commit `.env.local`.
```

Use the US hosts shown by PostHog instead if the project was created in the US
region. Redeploy after saving the variables.

## 3. Verify before relying on the data

1. Open a private browser window so the founder `gp_internal` flag is absent.
2. Visit production and choose **Allow analytics**.
3. Navigate through at least two pages and use one core feature.
4. In PostHog, confirm `$pageview`, a product event, and a session recording.
5. Confirm replay text and every form value appear masked.
6. Choose **Essential only** from the Privacy page and confirm new events stop.

## Suggested first insights

- Funnel: `$pageview` on `/mystery` -> `mystery_search` -> `conversion` where
  `type = mystery_revealed` -> `booking_click`.
- Funnel: `$pageview` on `/search` -> `flight_search` -> `booking_click`.
- Break down landing-page conversion by referrer, country, device, and browser.
- Review recordings with two or more page views or a product event; skip
  single-page, zero-interaction sessions first.

Standard crawlers normally do not run the browser SDK, so PostHog is a human
behavior tool rather than a complete crawler counter. Continue using the
server-side `ai_crawler` and `crawler_visit` events in the existing admin
dashboard for recognized AI, search, and SEO crawlers, and Vercel Web Analytics
for its User-Agent-filtered visitor count.
