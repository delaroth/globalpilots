import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getEditorialPostBySlug } from '@/lib/blog-posts'

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

    // Check editorial posts first (static, no DB needed)
    const editorialPost = getEditorialPostBySlug(slug)
    if (editorialPost) {
      console.log('[Blog Slug] Found editorial post:', slug)
      return NextResponse.json({
        success: true,
        post: {
          id: editorialPost.id,
          title: editorialPost.title,
          meta_description: editorialPost.meta_description,
          slug: editorialPost.slug,
          view_count: editorialPost.view_count,
          created_at: editorialPost.created_at,
          type: 'editorial',
          category: editorialPost.category,
          excerpt: editorialPost.excerpt,
          content: editorialPost.content
        }
      })
    }

    // Fall back to Supabase destination guides
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

    console.log('[Blog Slug] Found destination guide:', slug)

    // Transform to frontend format
    const post = {
      id: data.id,
      destination_code: data.destination_code,
      destination_name: data.destination_name,
      country: data.country,
      title: data.title,
      meta_description: data.meta_description,
      content: data.content,
      slug: data.slug,
      view_count: data.view_count + 1,
      created_at: data.created_at,
      type: 'destination'
    }

    return NextResponse.json({
      success: true,
      post
    })

  } catch (error) {
    console.error('[Blog Slug] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog post. Please try again.' },
      { status: 500 }
    )
  }
}
