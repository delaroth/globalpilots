import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('[Blog List] Fetching all blog posts...')

    // Fetch all blog posts ordered by view count
    const { data, error } = await (supabase as any)
      .from('blog_posts')
      .select('*')
      .order('view_count', { ascending: false })

    if (error) {
      console.error('[Blog List] Database error:', error)
      throw new Error('Failed to fetch blog posts')
    }

    console.log(`[Blog List] ✅ Found ${data.length} blog posts`)

    // Transform to frontend format
    const posts = data.map((post: any) => ({
      id: post.id,
      destinationCode: post.destination_code,
      destinationName: post.destination_name,
      country: post.country,
      title: post.title,
      metaDescription: post.meta_description,
      slug: post.slug,
      viewCount: post.view_count,
      createdAt: post.created_at,
      updatedAt: post.updated_at
    }))

    return NextResponse.json({
      success: true,
      posts
    })

  } catch (error) {
    console.error('[Blog List] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch blog posts'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
