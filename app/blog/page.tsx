'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface BlogPost {
  id: string
  destination_code: string
  destination_name: string
  country: string
  title: string
  meta_description: string
  slug: string
  view_count: number
  created_at: string
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/blog/list')

        if (!response.ok) {
          throw new Error('Failed to fetch blog posts')
        }

        const data = await response.json()
        setPosts(data.posts || [])
      } catch (err) {
        console.error('Error fetching blog posts:', err)
        setError('Failed to load blog posts. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()
  }, [])

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
          <Link href="/" className="text-skyblue hover:text-skyblue-light transition">
            Back to Home
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Travel Guides
          </h1>
          <p className="text-xl text-skyblue-light max-w-2xl mx-auto">
            Comprehensive destination guides to help you plan your perfect trip
          </p>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block w-16 h-16 border-4 border-skyblue border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-white text-lg">Loading travel guides...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-2 border-red-500 rounded-xl p-8 text-center">
              <p className="text-red-700 font-semibold text-lg">{error}</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <div className="text-6xl mb-4">✈️</div>
              <h2 className="text-2xl font-bold text-navy mb-2">No Guides Yet</h2>
              <p className="text-gray-600 mb-6">
                Travel guides are generated when users discover mystery destinations.
              </p>
              <Link
                href="/mystery"
                className="inline-block bg-skyblue hover:bg-skyblue-dark text-navy font-semibold py-3 px-8 rounded-lg transition"
              >
                Discover a Mystery Destination
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] group"
                >
                  {/* Header with gradient */}
                  <div className="h-32 bg-gradient-to-br from-skyblue via-skyblue-dark to-navy relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl">🌍</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <h3 className="text-white font-bold text-lg line-clamp-1">
                        {post.destination_name}
                      </h3>
                      <p className="text-skyblue-light text-sm">{post.country}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h4 className="font-bold text-navy text-lg mb-2 line-clamp-2 group-hover:text-skyblue transition">
                      {post.title}
                    </h4>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {post.meta_description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                      <span>{post.view_count} views</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Read more indicator */}
                  <div className="px-5 pb-4">
                    <span className="text-skyblue font-semibold text-sm group-hover:underline">
                      Read Guide →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* CTA Section */}
        {!isLoading && !error && posts.length > 0 && (
          <div className="max-w-4xl mx-auto mt-16">
            <div className="bg-skyblue/10 backdrop-blur-sm rounded-2xl p-8 border border-skyblue/20 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Ready for Your Next Adventure?
              </h2>
              <p className="text-skyblue-light mb-6">
                Discover your perfect mystery destination with our AI-powered trip planner
              </p>
              <Link
                href="/mystery"
                className="inline-block bg-skyblue hover:bg-skyblue-dark text-navy font-bold py-4 px-8 rounded-lg transition shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                ✨ Discover Mystery Destination
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
