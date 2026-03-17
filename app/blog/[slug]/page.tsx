'use client'

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { buildBookingBundle, AFFILIATE_FLAGS } from '@/lib/affiliate'
import { majorAirports } from '@/lib/geolocation'

interface BlogContent {
  why_visit: string
  best_time_to_visit: string
  budget_breakdown: string
  top_attractions: string
  local_food_guide: string
  money_saving_tips: string
  safety_tips: string
}

interface DestinationPost {
  id: string
  destination_code: string
  destination_name: string
  country: string
  title: string
  meta_description: string
  content: BlogContent
  slug: string
  view_count: number
  created_at: string
  type: 'destination'
}

interface EditorialPost {
  id: string
  title: string
  meta_description: string
  content: string // HTML content
  slug: string
  view_count: number
  created_at: string
  type: 'editorial'
  category: string
  excerpt: string
}

type BlogPost = DestinationPost | EditorialPost

// Try to extract origin/destination from blog post title and slug
function extractRouteInfo(post: DestinationPost): { originIata: string | null; destIata: string; destCity: string } {
  const destCity = post.destination_name
  const destIata = post.destination_code

  const fromMatch = post.title.match(/from\s+(.+?)(?:\s+to|\s*$)/i)
  let originIata: string | null = null

  if (fromMatch) {
    const originCity = fromMatch[1].trim()
    const airport = majorAirports.find(
      a => a.city.toLowerCase() === originCity.toLowerCase() || a.code === originCity.toUpperCase()
    )
    if (airport) originIata = airport.code
  }

  return { originIata, destIata, destCity }
}

function EditorialPostView({ post }: { post: EditorialPost }) {
  return (
    <>
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-sky-600 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-5">
            <span className="text-[200px]">&#x2708;&#xFE0F;</span>
          </div>
          <div className="relative z-10">
            {post.category && (
              <span className="inline-block bg-sky-500/20 text-sky-300 text-sm font-semibold px-4 py-1 rounded-full mb-4 uppercase tracking-wide">
                {post.category}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              {post.title}
            </h1>
            <p className="text-lg text-sky-300/80 max-w-2xl mx-auto mb-4">
              {post.excerpt}
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-white/60">
              <span>{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        <article className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div
            className="prose prose-lg max-w-none
              prose-headings:text-slate-900 prose-headings:font-bold
              prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
              prose-p:text-gray-700 prose-p:leading-relaxed
              prose-a:text-sky-400 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
              prose-li:text-gray-700
              prose-strong:text-slate-900
              prose-ul:my-4 prose-li:my-1"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        {/* Back to Blog */}
        <div className="mt-8 text-center">
          <Link
            href="/blog"
            className="inline-block bg-white hover:bg-gray-50 text-slate-900 font-semibold py-3 px-8 rounded-lg transition shadow-lg"
          >
            &larr; Back to All Guides
          </Link>
        </div>
      </div>
    </>
  )
}

function DestinationPostView({ post }: { post: DestinationPost }) {
  const routeInfo = extractRouteInfo(post)
  const defaultOrigin = routeInfo.originIata || 'BKK'
  const departDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  const bookingBundle = buildBookingBundle({
    origin: defaultOrigin,
    destination: routeInfo.destIata,
    cityName: routeInfo.destCity,
    departDate,
    nights: 3,
  })

  return (
    <>
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-gradient-to-br from-sky-500 via-sky-600 to-slate-900 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <span className="text-9xl">&#x1F30D;</span>
          </div>
          <div className="relative z-10">
            <p className="text-sky-300 text-sm font-semibold mb-2 uppercase tracking-wide">
              Travel Guide
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              {post.destination_name}
            </h1>
            <p className="text-xl text-sky-300 mb-4">{post.country}</p>
            <div className="flex items-center justify-center gap-6 text-sm text-white/80">
              <span>{post.view_count} views</span>
              <span>&bull;</span>
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        <article className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <p className="text-lg text-gray-700 italic mb-8 pb-8 border-b border-gray-200">
            {post.meta_description}
          </p>

          <section className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="text-4xl">&#x2728;</span>
              Why Visit {post.destination_name}?
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {post.content.why_visit}
              </p>
            </div>
          </section>

          <section className="mb-8 bg-sky-500/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="text-3xl">&#x1F4C5;</span>
              Best Time to Visit
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.content.best_time_to_visit}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="text-3xl">&#x1F4B0;</span>
              Budget Breakdown
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.content.budget_breakdown}
            </p>
          </section>

          <section className="mb-8 bg-yellow-50 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="text-3xl">&#x1F3AF;</span>
              Top Attractions
            </h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.content.top_attractions}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="text-3xl">&#x1F37D;&#xFE0F;</span>
              Local Food Guide
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.content.local_food_guide}
            </p>
          </section>

          <section className="mb-8 bg-green-50 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="text-3xl">&#x1F4A1;</span>
              Money Saving Tips
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.content.money_saving_tips}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="text-3xl">&#x1F6E1;&#xFE0F;</span>
              Safety Tips
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.content.safety_tips}
            </p>
          </section>

          {/* BOOK THIS TRIP */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="bg-gradient-to-r from-sky-500/20 to-slate-900/20 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-3 text-center">
                Book Your Trip to {post.destination_name}
              </h3>
              <p className="text-gray-700 mb-6 text-center">
                Ready to go? Book flights, hotels, and activities for your trip.
              </p>
              <div className="space-y-3 max-w-md mx-auto">
                <a
                  href={bookingBundle.flightUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg transition shadow-lg text-center"
                >
                  {AFFILIATE_FLAGS.kiwi ? 'Search Flights on Kiwi' : 'Search Flights on Aviasales'}
                </a>
                <a
                  href={bookingBundle.hotelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-lg transition shadow-lg text-center"
                >
                  Search Hotels on Agoda
                </a>
                <a
                  href={bookingBundle.activitiesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-lg transition shadow-lg text-center"
                >
                  Browse Activities on GetYourGuide
                </a>
              </div>
              <div className="mt-6 text-center">
                <Link
                  href="/mystery"
                  className="inline-block text-sky-400 hover:text-sky-600 font-semibold transition"
                >
                  Or let AI plan your perfect trip &rarr;
                </Link>
              </div>
            </div>
          </div>
        </article>

        {/* Back to Guides */}
        <div className="mt-8 text-center">
          <Link
            href="/blog"
            className="inline-block bg-white hover:bg-gray-50 text-slate-900 font-semibold py-3 px-8 rounded-lg transition shadow-lg"
          >
            &larr; Back to All Guides
          </Link>
        </div>
      </div>
    </>
  )
}

export default function BlogPostPage() {
  const params = useParams()
  const slug = params.slug as string

  const [post, setPost] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/blog/${slug}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Blog post not found')
          }
          throw new Error('Failed to fetch blog post')
        }

        const data = await response.json()
        setPost(data.post)

        // Update document title for SEO
        if (data.post) {
          document.title = `${data.post.title} | GlobePilots`
          const metaDesc = document.querySelector('meta[name="description"]')
          if (metaDesc) {
            metaDesc.setAttribute('content', data.post.meta_description || '')
          }
        }
      } catch (err) {
        console.error('Error fetching blog post:', err)
        setError(err instanceof Error ? err.message : 'Failed to load blog post')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPost()
  }, [slug])

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    alert('Link copied to clipboard!')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg">Loading guide...</p>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
        <nav className="w-full px-6 py-4 bg-slate-900/95 backdrop-blur-sm border-b border-sky-500/20">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center">
                <span className="text-slate-900 text-xl font-bold">G</span>
              </div>
              <span className="text-white text-xl font-bold">GlobePilot</span>
            </Link>
            <Link href="/blog" className="text-sky-400 hover:text-sky-300 transition">
              Back to Guides
            </Link>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto bg-red-50 border-2 border-red-500 rounded-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-red-700 mb-2">{error}</h1>
            <p className="text-red-600 mb-6">The guide you&apos;re looking for doesn&apos;t exist.</p>
            <Link
              href="/blog"
              className="inline-block bg-sky-500 hover:bg-sky-600 text-slate-900 font-semibold py-3 px-8 rounded-lg transition"
            >
              View All Guides
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Navigation */}
      <nav className="w-full px-6 py-4 bg-slate-900/95 backdrop-blur-sm border-b border-sky-500/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center">
              <span className="text-slate-900 text-xl font-bold">G</span>
            </div>
            <span className="text-white text-xl font-bold">GlobePilot</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/blog" className="text-sky-400 hover:text-sky-300 transition">
              All Guides
            </Link>
            <Link href="/" className="text-sky-400 hover:text-sky-300 transition">
              Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        {post.type === 'editorial' ? (
          <EditorialPostView post={post as EditorialPost} />
        ) : (
          <DestinationPostView post={post as DestinationPost} />
        )}

        {/* Share button */}
        <div className="mt-4 text-center">
          <button
            onClick={handleShare}
            className="text-sky-400 hover:text-sky-600 font-semibold transition"
          >
            Share this guide
          </button>
        </div>
      </div>
    </div>
  )
}
