# Traffic review - September 5, 2026

Source: Vercel Web Analytics, Production, August 6 through September 5, 2026.
Panel rows are visitor counts and can overlap because one person can visit more
than one page. Only the leading rows visible in the dashboard are listed.

## Headline metrics

- 148 visitors (33% lower than the preceding comparison period)
- 298 page views (16% lower)
- 68% bounce rate (11% lower)
- 2.01 page views per visitor

The most recent seven days were stronger on engagement: 34 visitors generated
94 page views (2.76 per visitor), with a 53% bounce rate. Traffic volume was
still down versus the preceding seven-day comparison (visitors -13%, page views
-6%), but the people who arrived explored more pages.

## What visitors used

| Page | Visitors | Share of all visitors* |
| --- | ---: | ---: |
| `/mystery` | 46 | 31% |
| `/` | 38 | 26% |
| `/mystery-flights` | 25 | 17% |
| `/best-time/florianopolis` | 12 | 8% |
| `/search` | 10 | 7% |
| `/deals` | 8 | 5% |
| `/trip-cost` | 7 | 5% |

\*Shares are directional, not additive, because page audiences overlap.

The clearest product signal is mystery travel: the two mystery routes account
for the largest audiences. The Florianopolis SEO page also appears as a real
organic landing-page opportunity despite being a single destination page.

## Acquisition

Visible referrers were Bing 13, DuckDuckGo 10, ChatGPT 7, Google 3, Ecosia 2,
Yahoo 2, and Yahoo Ireland 1. Those rows account for 38 visitors (26% of the
total); additional referrers may exist below the visible list. Search engines
other than ChatGPT account for at least 31 visitors (21%). ChatGPT referrals are
4.7% of all visitors and represent people clicking through from ChatGPT, not
OpenAI's crawler.

## Audience shape

- Countries: United States 28%, China 21%, Singapore 7%, Germany 4%, UK 4%.
- Devices: desktop 50%, mobile 50%.
- Operating systems: Android 26%, iOS 24%, Windows 22%, GNU/Linux 16%, Mac 12%.

China, Singapore, and GNU/Linux are elevated enough to segment, but none proves
automation. Vercel states that Web Analytics excludes automated traffic by
inspecting User-Agent headers. The 148 should therefore be treated as Vercel's
best estimate of human/browser visitors, while acknowledging that sophisticated
headless clients can imitate a browser and some privacy tools alter attribution.

## Human versus crawler measurement

Use three separate numbers rather than forcing one unreliable percentage:

1. **Likely people:** Vercel Web Analytics visitors, which exclude recognized
   automated User-Agents.
2. **Recognized crawlers:** server-side `ai_crawler` and `crawler_visit` events
   in the GlobePilot admin dashboard. These include known AI, search, and SEO
   crawler User-Agents after this change is deployed.
3. **Engaged people:** consented PostHog sessions that contain a second page
   view or a core product event. This is the highest-confidence audience, not a
   count of every real person because visitors can decline analytics or block it.

Do not subtract PostHog sessions from Vercel visitors: consent and blocking mean
the two systems intentionally cover different populations.

## First questions to answer after 2-4 weeks of PostHog data

- Which referrers produce a mystery search, reveal, or booking click?
- Does `/best-time/florianopolis` lead into a planning tool or end as a bounce?
- Where do users abandon the `/mystery` and `/search` funnels?
- Are mobile visitors failing on a specific input, result state, or CTA?
- Do China/Singapore sessions contain normal scrolling and feature use, or only
  repeated single-page loads with no meaningful interaction?
