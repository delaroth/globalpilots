# GlobePilots — AI-powered budget travel app

Next.js 14.2 (App Router, no src/), TypeScript, Tailwind. Deployed on Vercel.
Solo founder project. Prefer the shortest fix that holds up long-term over clever rewrites.

## Commands

- Dev: `npm run dev`
- Build (use this to verify changes): `npm run build`
- Typecheck only: `npx tsc --noEmit`
- Lint: `npm run lint`
- No test suite yet — verify with build + typecheck before declaring done.

## Structure

- `app/` — ~40 page routes + `app/api/` (~45 route groups)
- `lib/` — business logic (~50 modules); subfolders: `flight-providers/`, `flight-intelligence/`, `enrichment/`
- `components/` — flat folder, PascalCase (e.g. `MysteryReveal.tsx`)
- `data/` — static datasets (airport coordinates, passports, visas, festivals, tipping, plug types, key phrases)
- `hooks/` — `useCurrency`, `useSmartDefaults` only
- Root: `middleware.ts`, raw Supabase `.sql` schema files
- IGNORE `globe-pilots-video/` — separate sub-project, untracked, not part of the app

## Stack notes

- Auth: NextAuth v4 (`lib/auth.ts`, `lib/auth-config.ts`) — NOT v5/Auth.js. Don't suggest v5 APIs.
- DB: Supabase via `lib/supabase.ts`. Schema lives in root `.sql` files — update them when changing tables.
- Rate limiting: Upstash (`lib/rate-limit.ts`). Email: Resend (`lib/resend.ts`). Validation: Zod.
- AI: DeepSeek is the primary LLM, Anthropic Claude is the fallback (`lib/ai.ts`). Keep that order in AI endpoints.
- SEO is code: `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`. The sitemap
  auto-includes editorial blog posts (via `getAllEditorialPosts()` in `lib/blog-posts.ts`),
  but any other new public page must be added to `app/sitemap.ts` manually.
- Blog posts are NOT files: editorial posts live as HTML-content entries in the
  `editorialPosts` array in `lib/blog-posts.ts`, served by `app/blog/[slug]/page.tsx`
  alongside Supabase-backed destination guides (`blog_posts` table).

## Flight data constraints (hard-won — do not relearn these)

- TravelPayouts/Aviasales Data API reads a SHARED CACHE populated by Aviasales users.
  It is unreliable/empty for thin or non-mainstream routes. Never treat an empty
  response as "no flights exist."
- Layover Arbitrage and other thin-route features MUST fall back to Kiwi Tequila
  (virtual interlining, no MAU requirement) when the TravelPayouts cache is empty.
- Aviasales real-time Search API: requires 50k MAU and forbids mixing with other
  metasearch APIs — we don't use it. Don't suggest it.
- Amadeus Self-Service: real-time but no affiliate commission, weak LCC coverage.
  Use only where commission doesn't matter.
- Hotels: Booking.com rejected us. Current play: Agoda deep-links (no commission yet),
  applying to Agoda affiliate directly. Don't add Booking.com links.
- Activities: GetYourGuide (Europe/worldwide), Klook (SE Asia legacy).
- NICHE PIVOT (June 2026): primary specialization is the BALKANS (founder lives in
  Bulgaria) — local partnerships/affiliates + Balkan content depth are the moat,
  not SE Asia. Daily price-history cron tracks 8 EU origins × 15 Balkan
  destinations (lib/tracked-routes.ts) — this dataset is the long-term moat;
  never break the cron silently.

## Known fragile areas

- `app/mystery/` + `MysteryReveal.tsx` — history of blank screen, hidden reveal
  button, missing auto-scroll. Test the full reveal flow after touching anything here.
- `app/layover/` — must degrade gracefully to multi-leg Kiwi routing; check the
  empty-cache path, not just the happy path.

## Conventions

- Validate all API route inputs with Zod.
- Affiliate links: centralize URL construction in lib/, never hardcode partner
  URLs inside components.
- When compacting, always preserve: the list of modified files, the build/typecheck
  commands, and any flight-API constraint mentioned above.

## Deeper docs (read only when relevant)

- @docs/affiliate-strategy.md — full affiliate/API decision history
- @docs/seo-blog-strategy.md — blog content plan
