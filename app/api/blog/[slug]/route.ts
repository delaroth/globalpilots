import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing slug parameter' },
        { status: 400 }
      )
    }

    console.log('[Blog Slug] Fetching blog post:', slug)

    // Fetch blog post by slug
    const { data, error } = await (supabase as any)
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !data) {
      console.error('[Blog Slug] Blog post not found:', slug)
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await (supabase as any)
      .from('blog_posts')
      .update({ view_count: data.view_count + 1 })
      .eq('id', data.id)

    console.log('[Blog Slug] ✅ Blog post fetched:', slug)

    // Transform to frontend format
    const post = {
      id: data.id,
      destinationCode: data.destination_code,
      destinationName: data.destination_name,
      country: data.country,
      title: data.title,
      metaDescription: data.meta_description,
      content: data.content,
      slug: data.slug,
      viewCount: data.view_count + 1, // Return updated count
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

    return NextResponse.json({
      success: true,
      post
    })

  } catch (error) {
    console.error('[Blog Slug] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch blog post'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
