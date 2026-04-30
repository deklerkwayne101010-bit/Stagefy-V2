// Publish content to Facebook
import { NextResponse } from 'next/server'
import { getCurrentUser, supabase } from '@/lib/supabase'
import { refundCredits } from '@/lib/credits'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { contentCalendarId } = await request.json()

    if (!contentCalendarId) {
      return NextResponse.json({ error: 'contentCalendarId is required' }, { status: 400 })
    }

    // Fetch the content calendar entry
    const { data: entry, error: entryError } = await supabase
      .from('content_calendar')
      .select('*')
      .eq('id', contentCalendarId)
      .eq('user_id', user.id)
      .single()

    if (entryError || !entry) {
      return NextResponse.json({ error: 'Content entry not found' }, { status: 404 })
    }

    if (entry.status === 'published') {
      return NextResponse.json({ error: 'Already published' }, { status: 400 })
    }

    // Find an active Facebook account for this user
    const { data: accounts, error: accountsError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'facebook')
      .eq('is_active', true)
      .limit(1)

    if (accountsError || !accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: 'No connected Facebook account found. Please connect your account first.' },
        { status: 400 }
      )
    }

    const facebookAccount = accounts[0]

    try {
      // If there's an image, upload it to Facebook first
      let mediaId = null
      if (entry.image_url) {
        // Note: For production, you'd need to upload the image to Facebook's Graph API
        // This is a simplified version - actual implementation would:
        // 1. Download the image from your storage
        // 2. Upload to Facebook via /{page-id}/photos with published=false to get a media ID
        // 3. Use that media ID in the post
        console.log('Image URL to publish:', entry.image_url)
        // Placeholder: Facebook requires publishing media separately first
      }

      // Publish the post to Facebook Page
      const pageId = facebookAccount.account_id
      const pageAccessToken = facebookAccount.access_token

      const message = entry.caption + '\n\n' + (entry.callToAction || '')

      const fbResponse = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/feed?access_token=${pageAccessToken}&message=${encodeURIComponent(message)}`,
        { method: 'POST' }
      )

      const fbData = await fbResponse.json()

      if (!fbResponse.ok) {
        throw new Error(fbData.error?.message || 'Failed to publish to Facebook')
      }

      const postId = fbData.id

      // Update calendar entry
      await supabase
        .from('content_calendar')
        .update({
          status: 'published',
          post_id: postId,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', contentCalendarId)

      // Record analytics entry (initial with 0 metrics)
      await supabase.from('content_analytics').insert({
        content_calendar_id: contentCalendarId,
        platform: 'facebook',
        date: new Date().toISOString().split('T')[0],
        impressions: 0,
        reach: 0,
        engagements: 0,
        likes: 0,
        comments: 0,
        shares: 0,
      })

      return NextResponse.json({
        success: true,
        postId,
        platform: 'facebook',
        message: 'Published successfully to Facebook',
      })

    } catch (publishError: any) {
      console.error('Facebook publish error:', publishError)

      // Update entry status to failed
      await supabase
        .from('content_calendar')
        .update({
          status: 'failed',
          publish_error: publishError.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contentCalendarId)

      // Refund 5 credits for failed publish
      await refundCredits(user.id, 'template_generation', `publish-fb-${contentCalendarId}`)

      return NextResponse.json(
        { error: `Failed to publish: ${publishError.message}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Facebook publish route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
