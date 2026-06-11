import { MetadataRoute } from 'next'
import { majorAirports } from '@/lib/geolocation'
import { getAllRegions } from '@/lib/destination-costs'
import { getAllEditorialPosts } from '@/lib/blog-posts'
import {
  slugify,
  getTopDestinations,
  MYSTERY_ORIGIN_CODES,
  TOP_ORIGIN_CODES,
} from '@/lib/seo-config'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://globepilots.com'

  // Only pages worth indexing belong here — long-tail programmatic pages
  // stay live for users but are noindexed and excluded (see lib/seo-config.ts).

  // Mystery flights: curated English-market hubs only (was: all 487 airports)
  const mysteryFlightPages: MetadataRoute.Sitemap = majorAirports
    .filter((a) => MYSTERY_ORIGIN_CODES.includes(a.code))
    .map((a) => ({
      url: `${baseUrl}/mystery-flights/${a.code}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

  // Blog: editorial posts only. Destination-guide slugs are excluded — the
  // blog_posts table has no content for them yet and they currently 404.
  const topDestinations = getTopDestinations()
  const blogPages: MetadataRoute.Sitemap = getAllEditorialPosts().map(p => ({
    url: `${baseUrl}/blog/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // SEO: cheap flights to top destinations only
  const cheapFlightPages: MetadataRoute.Sitemap = topDestinations.map((d) => ({
    url: `${baseUrl}/cheap-flights/${slugify(d.city)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // SEO: flights from major origins
  const originAirports = majorAirports.filter((a) => TOP_ORIGIN_CODES.includes(a.code))
  const flightsFromPages: MetadataRoute.Sitemap = originAirports.map((a) => ({
    url: `${baseUrl}/flights-from/${slugify(a.city)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // SEO: best time to visit top destinations only
  const bestTimePages: MetadataRoute.Sitemap = topDestinations.map((d) => ({
    url: `${baseUrl}/best-time/${slugify(d.city)}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // SEO: budget travel by region
  const regions = getAllRegions()
  const budgetTravelPages: MetadataRoute.Sitemap = regions.map((r) => ({
    url: `${baseUrl}/budget-travel/${slugify(r)}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [
    // Core pages
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },

    // AI Trip Planner
    {
      url: `${baseUrl}/mystery`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/plan-my-trip`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/quiz`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/inspire`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },

    {
      url: `${baseUrl}/day-trip`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },

    // Flights
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/stopover`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },

    // Plan
    {
      url: `${baseUrl}/trip-cost`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/whats-happening`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },

    // Deals
    {
      url: `${baseUrl}/deals`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },

    // Content & SEO
    {
      url: `${baseUrl}/tools`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/mystery-flights`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },

    // SEO index pages
    {
      url: `${baseUrl}/cheap-flights`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/flights-from`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/budget-travel`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/best-time`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },

    // About & Legal
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...mysteryFlightPages,
    ...cheapFlightPages,
    ...flightsFromPages,
    ...budgetTravelPages,
    ...bestTimePages,
    ...blogPages,
  ]
}
