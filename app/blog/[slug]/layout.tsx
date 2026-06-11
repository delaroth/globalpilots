import { Metadata } from 'next'
import { getEditorialPostBySlug } from '@/lib/blog-posts'
import { getAllDestinations } from '@/lib/destination-costs'
import { slugify, NOINDEX_ROBOTS } from '@/lib/seo-config'

// The blog page itself is a client component, so title/description/canonical
// must be generated here — without this layout, crawlers get no metadata at all.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const canonical = `https://globepilots.com/blog/${slug}`

  const editorial = getEditorialPostBySlug(slug)
  if (editorial) {
    return {
      title: `${editorial.title} | GlobePilot`,
      description: editorial.meta_description,
      alternates: { canonical },
      openGraph: {
        title: editorial.title,
        description: editorial.meta_description,
        url: canonical,
        type: 'article',
      },
    }
  }

  // Destination guide slugs match slugify(city) from the cost database.
  // These are noindexed until the blog_posts table actually has content
  // for them — today they render a "not found" state client-side.
  const dest = getAllDestinations().find((d) => slugify(d.city) === slug)
  if (dest) {
    const title = `${dest.city} Travel Guide — Budget, Best Time & Tips | GlobePilot`
    const description = `Complete budget travel guide to ${dest.city}, ${dest.country}: daily costs, best time to visit, top attractions, local food, and money-saving tips.`
    return {
      title,
      description,
      alternates: { canonical },
      robots: NOINDEX_ROBOTS,
      openGraph: {
        title,
        description,
        url: canonical,
        type: 'article',
      },
    }
  }

  return {
    title: 'Blog | GlobePilot',
    alternates: { canonical },
    robots: NOINDEX_ROBOTS,
  }
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return children
}
