import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAllEditorialPosts } from '@/lib/blog-posts'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('[Blog List] Fetching all blog posts...')

    // Fetch Supabase destination guides
    let supabasePosts: any[] = []
    try {
      const { data, error } = await (supabase as any)
        .from('blog_posts')
        .select('*')
        .order('view_count', { ascending: false })

      if (!error && data) {
        supabasePosts = data
      }
    } catch (e) {
      console.warn('[Blog List] Supabase fetch failed, continuing with editorial posts only')
    }

    console.log(`[Blog List] Found ${supabasePosts.length} destination guides`)

    // Transform Supabase posts to frontend format
    const destinationPosts = supabasePosts.map((post: any) => ({
      id: post.id,
      destination_code: post.destination_code,
      destination_name: post.destination_name,
      country: post.country,
      title: post.title,
      meta_description: post.meta_description,
      slug: post.slug,
      view_count: post.view_count,
      created_at: post.created_at,
      type: 'destination' as const
    }))

    // Get static editorial posts
    const editorialPosts = getAllEditorialPosts().map(post => ({
      id: post.id,
      destination_code: null,
      destination_name: null,
      country: null,
      title: post.title,
      meta_description: post.meta_description,
      slug: post.slug,
      view_count: post.view_count,
      created_at: post.created_at,
      type: 'editorial' as const,
      category: post.category,
      excerpt: post.excerpt
    }))

    // Combine and sort: editorial first (they're the SEO content), then destination guides
    const allPosts = [...editorialPosts, ...destinationPosts]

    console.log(`[Blog List] Total posts: ${allPosts.length} (${editorialPosts.length} editorial + ${destinationPosts.length} destination)`)

    return NextResponse.json({
      success: true,
      posts: allPosts
    })

  } catch (error) {
    console.error('[Blog List] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog posts. Please try again.' },
      { status: 500 }
    )
  }
}
