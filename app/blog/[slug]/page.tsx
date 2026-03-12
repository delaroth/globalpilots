'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface BlogContent {
  why_visit: string
  best_time_to_visit: string
  budget_breakdown: string
  top_attractions: string
  local_food_guide: string
  money_saving_tips: string
  safety_tips: string
}

interface BlogPost {
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
      <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-light flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-skyblue border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg">Loading guide...</p>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-light">
        <nav className="w-full px-6 py-4 bg-navy/50 backdrop-blur-sm border-b border-skyblue/20">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-skyblue rounded-full flex items-center justify-center">
                <span className="text-navy text-xl font-bold">G</span>
              </div>
              <span className="text-white text-xl font-bold">GlobePilot</span>
            </Link>
            <Link href="/blog" className="text-skyblue hover:text-skyblue-light transition">
              Back to Guides
            </Link>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto bg-red-50 border-2 border-red-500 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-700 mb-2">{error}</h1>
            <p className="text-red-600 mb-6">The guide you're looking for doesn't exist.</p>
            <Link
              href="/blog"
              className="inline-block bg-skyblue hover:bg-skyblue-dark text-navy font-semibold py-3 px-8 rounded-lg transition"
            >
              View All Guides
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-light">
      {/* Navigation */}
      <nav className="w-full px-6 py-4 bg-navy/50 backdrop-blur-sm border-b border-skyblue/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-skyblue rounded-full flex items-center justify-center">
              <span className="text-navy text-xl font-bold">G</span>
            </div>
            <span className="text-white text-xl font-bold">GlobePilot</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/blog" className="text-skyblue hover:text-skyblue-light transition">
              All Guides
            </Link>
            <Link href="/" className="text-skyblue hover:text-skyblue-light transition">
              Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-gradient-to-br from-skyblue via-skyblue-dark to-navy rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <span className="text-9xl">🌍</span>
            </div>
            <div className="relative z-10">
              <p className="text-skyblue-light text-sm font-semibold mb-2 uppercase tracking-wide">
                Travel Guide
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                {post.destination_name}
              </h1>
              <p className="text-xl text-skyblue-light mb-4">{post.country}</p>
              <div className="flex items-center justify-center gap-6 text-sm text-white/80">
                <span>{post.view_count} views</span>
                <span>•</span>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <article className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
            {/* Meta Description */}
            <p className="text-lg text-gray-700 italic mb-8 pb-8 border-b border-gray-200">
              {post.meta_description}
            </p>

            {/* Why Visit */}
            <section className="mb-8">
              <h2 className="text-3xl font-bold text-navy mb-4 flex items-center gap-3">
                <span className="text-4xl">✨</span>
                Why Visit {post.destination_name}?
              </h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {post.content.why_visit}
                </p>
              </div>
            </section>

            {/* Best Time to Visit */}
            <section className="mb-8 bg-skyblue/10 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-navy mb-4 flex items-center gap-3">
                <span className="text-3xl">📅</span>
                Best Time to Visit
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {post.content.best_time_to_visit}
              </p>
            </section>

            {/* Budget Breakdown */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy mb-4 flex items-center gap-3">
                <span className="text-3xl">💰</span>
                Budget Breakdown
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {post.content.budget_breakdown}
              </p>
            </section>

            {/* Top Attractions */}
            <section className="mb-8 bg-yellow-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-navy mb-4 flex items-center gap-3">
                <span className="text-3xl">🎯</span>
                Top Attractions
              </h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {post.content.top_attractions}
              </div>
            </section>

            {/* Local Food Guide */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy mb-4 flex items-center gap-3">
                <span className="text-3xl">🍽️</span>
                Local Food Guide
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {post.content.local_food_guide}
              </p>
            </section>

            {/* Money Saving Tips */}
            <section className="mb-8 bg-green-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-navy mb-4 flex items-center gap-3">
                <span className="text-3xl">💡</span>
                Money Saving Tips
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {post.content.money_saving_tips}
              </p>
            </section>

            {/* Safety Tips */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-navy mb-4 flex items-center gap-3">
                <span className="text-3xl">🛡️</span>
                Safety Tips
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {post.content.safety_tips}
              </p>
            </section>

            {/* CTA */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="bg-gradient-to-r from-skyblue/20 to-navy/20 rounded-xl p-8 text-center">
                <h3 className="text-2xl font-bold text-navy mb-3">
                  Ready to Visit {post.destination_name}?
                </h3>
                <p className="text-gray-700 mb-6">
                  Let our AI plan your perfect trip with flights, hotels, and daily itineraries
                </p>
                <Link
                  href="/mystery"
                  className="inline-block bg-skyblue hover:bg-skyblue-dark text-navy font-bold py-4 px-8 rounded-lg transition shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  ✨ Plan Your Trip
                </Link>
              </div>
            </div>

            {/* Share */}
            <div className="mt-6 text-center">
              <button
                onClick={handleShare}
                className="text-skyblue hover:text-skyblue-dark font-semibold transition"
              >
                🔗 Share this guide
              </button>
            </div>
          </article>

          {/* Back to Guides */}
          <div className="mt-8 text-center">
            <Link
              href="/blog"
              className="inline-block bg-white hover:bg-gray-50 text-navy font-semibold py-3 px-8 rounded-lg transition shadow-lg"
            >
              ← Back to All Guides
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
