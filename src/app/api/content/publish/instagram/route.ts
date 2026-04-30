// Publish content to Instagram
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

    // Find an active Instagram account for this user
    const { data: accounts, error: accountsError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'instagram')
      .eq('is_active', true)
      .limit(1)

    if (accountsError || !accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: 'No connected Instagram account found. Please connect your account first.' },
        { status: 400 }
      )
    }

    const instagramAccount = accounts[0]

    try {
      // Instagram Graph API requires publishing in two steps:
      // 1. Create media container
      // 2. Publish the container

      const igUserId = instagramAccount.account_id
      const pageAccessToken = instagramAccount.access_token

      // Step 1: Create media container
      const caption = entry.caption + '\n\n' + (entry.callToAction || '')

      const mediaPayload = new URLSearchParams({
        image_url: entry.image_url || '',
        caption: caption,
        access_token: pageAccessToken,
      })

      const mediaResponse = await fetch(
        `https://graph.facebook.com/v18.0/${igUserId}/media?`,
        {
          method: 'POST',
          body: mediaPayload,
        }
      )

      const mediaData = await mediaResponse.json()

      if (!mediaResponse.ok) {
        throw new Error(mediaData.error?.message || 'Failed to create Instagram media container')
      }

      const creationId = mediaData.id

      // Step 2: Publish the media container
      const publishPayload = new URLSearchParams({
        creation_id: creationId,
        access_token: pageAccessToken,
      })

      const publishResponse = await fetch(
        `https://graph.facebook.com/v18.0/${igUserId}/media_publish?`,
        {
          method: 'POST',
          body: publishPayload,
        }
      )

      const publishData = await publishResponse.json()

      if (!publishResponse.ok) {
        throw new Error(publishData.error?.message || 'Failed to publish Instagram post')
      }

      const postId = publishData.id

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

      // Record analytics entry
      await supabase.from('content_analytics').insert({
        content_calendar_id: contentCalendarId,
        platform: 'instagram',
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
        platform: 'instagram',
        message: 'Published successfully to Instagram',
      })

    } catch (publishError: any) {
      console.error('Instagram publish error:', publishError)

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
      await refundCredits(user.id, 'template_generation', `publish-ig-${contentCalendarId}`)

      return NextResponse.json(
        { error: `Failed to publish: ${publishError.message}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Instagram publish route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
