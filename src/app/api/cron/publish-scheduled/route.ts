// Cron job to auto-publish scheduled content
// Triggered by Vercel Cron or external scheduler
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { refundCredits } from '@/lib/credits'

export const runtime = 'edge' // Use edge runtime for fast cold starts

export async function POST(request: Request) {
  try {
    // Verify CRON_SECRET for security
    const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('cron-secret')
    const expectedSecret = process.env.CRON_SECRET

    if (!expectedSecret || cronSecret !== expectedSecret) {
      console.error('Unauthorized cron attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date().toISOString()

    // Fetch scheduled posts ready to publish (scheduled_for <= now, status='scheduled')
    const { data: scheduledPosts, error: fetchError } = await supabase
      .from('content_calendar')
      .select('*')
      .lte('scheduled_for', now)
      .eq('status', 'scheduled')
      .order('scheduled_for', { ascending: true })

    if (fetchError) {
      console.error('Error fetching scheduled posts:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch scheduled posts' }, { status: 500 })
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No scheduled posts to publish',
        published: 0,
        failed: 0,
      })
    }

    const results = []
    let successCount = 0
    let failCount = 0

    for (const entry of scheduledPosts) {
      try {
        // Determine which platforms to publish to
        const platformsToPublish = entry.platform === 'both'
          ? ['facebook', 'instagram']
          : [entry.platform]

        // For 'both', verify both accounts exist before publishing
        if (entry.platform === 'both') {
          const { data: bothAccounts } = await supabase
            .from('social_accounts')
            .select('platform')
            .eq('user_id', entry.user_id)
            .in('platform', ['facebook', 'instagram'])
            .eq('is_active', true)

          const platformsFound = (bothAccounts || []).map((a: any) => a.platform)
          if (!platformsFound.includes('facebook') || !platformsFound.includes('instagram')) {
            throw new Error('Cannot publish to both platforms: one or both accounts not connected')
          }
        }

        for (const pubPlatform of platformsToPublish) {
          // Find active account
          const { data: accounts } = await supabase
            .from('social_accounts')
            .select('*')
            .eq('user_id', entry.user_id)
            .eq('platform', pubPlatform)
            .eq('is_active', true)
            .limit(1)

          if (!accounts || accounts.length === 0) {
            throw new Error(`No ${pubPlatform} account connected`)
          }

          const account = accounts[0]

          // Call Meta API to publish
          if (pubPlatform === 'facebook') {
            await publishToFacebook(entry, account)
          } else {
            await publishToInstagram(entry, account)
          }
        }

        // Mark as published
        await supabase
          .from('content_calendar')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', entry.id)

        successCount++
        results.push({ id: entry.id, success: true })

        // Handle recurrence: create next occurrence if recurring
        if (entry.is_recurring && entry.recurrence_rule) {
          await createNextOccurrence(entry)
        }

      } catch (err: any) {
        console.error(`Failed to publish entry ${entry.id}:`, err)

        // Mark as failed
        await supabase
          .from('content_calendar')
          .update({
            status: 'failed',
            publish_error: err.message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', entry.id)

        // Refund 5 credits
        await refundCredits(entry.user_id, 'template_generation', `cron-publish-${entry.id}`)

        failCount++
        results.push({ id: entry.id, success: false, error: err.message })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cron job completed: ${successCount} published, ${failCount} failed`,
      published: successCount,
      failed: failCount,
      results,
    })

  } catch (error) {
    console.error('Cron publish error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Facebook publishing logic
async function publishToFacebook(entry: any, account: any) {
  const pageId = account.account_id
  const pageAccessToken = account.access_token

  const message = entry.caption + '\n\n' + (entry.callToAction || '')

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}/feed?access_token=${pageAccessToken}&message=${encodeURIComponent(message)}`,
    { method: 'POST' }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'Facebook publish failed')
  }

  // Insert analytics
  await supabase.from('content_analytics').insert({
    content_calendar_id: entry.id,
    platform: 'facebook',
    date: new Date().toISOString().split('T')[0],
    impressions: 0,
    reach: 0,
    engagements: 0,
    likes: 0,
    comments: 0,
    shares: 0,
  })

  return data.id
}

// Instagram publishing logic
async function publishToInstagram(entry: any, account: any) {
  const igUserId = account.account_id
  const pageAccessToken = account.access_token

  const caption = entry.caption + '\n\n' + (entry.callToAction || '')

  // Step 1: Create media container
  const mediaResponse = await fetch(
    `https://graph.facebook.com/v18.0/${igUserId}/media?access_token=${pageAccessToken}`,
    {
      method: 'POST',
      body: new URLSearchParams({
        image_url: entry.image_url || '',
        caption: caption,
      }),
    }
  )

  const mediaData = await mediaResponse.json()
  if (!mediaResponse.ok) {
    throw new Error(mediaData.error?.message || 'Instagram media creation failed')
  }

  const creationId = mediaData.id

  // Step 2: Publish
  const publishResponse = await fetch(
    `https://graph.facebook.com/v18.0/${igUserId}/media_publish?access_token=${pageAccessToken}`,
    {
      method: 'POST',
      body: new URLSearchParams({ creation_id: creationId }),
    }
  )

  const publishData = await publishResponse.json()
  if (!publishResponse.ok) {
    throw new Error(publishData.error?.message || 'Instagram publish failed')
  }

  // Insert analytics
  await supabase.from('content_analytics').insert({
    content_calendar_id: entry.id,
    platform: 'instagram',
    date: new Date().toISOString().split('T')[0],
    impressions: 0,
    reach: 0,
    engagements: 0,
    likes: 0,
    comments: 0,
    shares: 0,
  })

  return publishData.id
}

// Create next occurrence for recurring posts
async function createNextOccurrence(entry: any) {
  // Simple recurrence: weekly or monthly based on recurrence_rule (iCal format)
  // For MVP, we'll infer from recurrence_rule or add 7 days if not specified
  const nextDate = new Date(entry.scheduled_for)
  nextDate.setDate(nextDate.getDate() + 7) // default weekly recurrence

  if (entry.recurrence_end_date && nextDate > new Date(entry.recurrence_end_date)) {
    // Recurrence ended
    return
  }

  await supabase.from('content_calendar').insert({
    user_id: entry.user_id,
    title: entry.title,
    caption: entry.caption,
    image_url: entry.image_url,
    platform: entry.platform,
    scheduled_for: nextDate.toISOString(),
    status: 'scheduled',
    is_recurring: true,
    recurrence_rule: entry.recurrence_rule,
    recurrence_end_date: entry.recurrence_end_date,
    visual_type: entry.visual_type,
  })
}
