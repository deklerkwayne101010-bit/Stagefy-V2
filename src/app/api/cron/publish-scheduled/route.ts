// Cron Job: Auto-publish scheduled content
// Runs every minute via Vercel Cron
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role for cron job
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Max retry attempts before marking as failed
const MAX_RETRIES = 3;

export async function GET(request: Request) {
  // Only allow Vercel Cron to access this endpoint
  const cronSecret = request.headers.get('x-vercel-cron-secret');
  const expectedSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === 'production' && cronSecret !== expectedSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('🚀 Publish cron job starting...');

    // Find all scheduled posts that are due and haven't exceeded retry limit
    const { data: duePosts, error: fetchError } = await supabase
      .from('content_calendar')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_date', new Date().toISOString())
      .lte('publish_attempts', MAX_RETRIES - 1)
      .order('scheduled_date', { ascending: true })
      .limit(20); // Process max 20 at a time

    if (fetchError) {
      console.error('Error fetching scheduled posts:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch scheduled posts' },
        { status: 500 }
      );
    }

    if (!duePosts || duePosts.length === 0) {
      console.log('✅ No posts due for publishing.');
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No posts due',
      });
    }

    console.log(`📦 Processing ${duePosts.length} scheduled posts...`);

    const results = {
      total: duePosts.length,
      published: 0,
      failed: 0,
      skipped: 0,
    };

    for (const post of duePosts) {
      try {
        console.log(`  📄 Publishing post: ${post.id} (${post.title})`);

        // Check if social account is connected for required platform
        const platforms = post.platform === 'both'
          ? ['facebook', 'instagram']
          : [post.platform];

        let publishSuccess = true;
        let publishedUrls: string[] = [];

        for (const platform of platforms) {
          // Get social account
          const { data: account } = await supabase
            .from('social_accounts')
            .select('*')
            .eq('user_id', post.user_id)
            .eq('platform', platform)
            .eq('is_active', true)
            .single();

          if (!account) {
            console.warn(`  ⚠️  No ${platform} account connected for user ${post.user_id}`);
            publishSuccess = false;
            continue;
          }

          // Check if image exists
          if (!post.generated_image_url) {
            console.error(`  ❌ No image for post ${post.id}`);
            publishSuccess = false;
            continue;
          }

          // Publish based on platform
          let postUrl: string | null = null;

          if (platform === 'facebook') {
            // Facebook Graph API
            const formData = new FormData();
            formData.append('url', post.generated_image_url);
            formData.append('caption', post.caption || '');
            formData.append('published', 'true');

            // Use stored access token
            const fbResponse = await fetch(
              `https://graph.facebook.com/v18.0/${account.page_id}/photos`,
              {
                method: 'POST',
                // Note: In production, use Meta SDK or proper token management
                // This is simplified - tokens expire and need refreshing
                headers: {
                  Authorization: `Bearer ${account.access_token}`,
                },
                body: formData,
              }
            );

            const fbResult = await fbResponse.json();
            if (!fbResponse.ok) {
              throw new Error(`Facebook: ${fbResult.error?.message || 'Unknown error'}`);
            }
            postUrl = `https://www.facebook.com/${fbResult.id}`;
          }

          if (platform === 'instagram') {
            // Instagram 2-step publish
            // Step 1: Create container
            const containerResponse = await fetch(
              `https://graph.facebook.com/v18.0/${account.page_id}/media`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${account.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  image_url: post.generated_image_url,
                  caption: post.caption || '',
                  media_type: 'IMAGE',
                }),
              }
            );

            const containerResult = await containerResponse.json();
            if (!containerResponse.ok) {
              throw new Error(`Instagram container: ${containerResult.error?.message || 'Unknown error'}`);
            }

            // Step 2: Publish
            const publishResponse = await fetch(
              `https://graph.facebook.com/v18.0/${account.page_id}/media_publish`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${account.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  creation_id: containerResult.id,
                }),
              }
            );

            const publishResult = await publishResponse.json();
            if (!publishResponse.ok) {
              throw new Error(`Instagram publish: ${publishResult.error?.message || 'Unknown error'}`);
            }
            postUrl = `https://www.instagram.com/p/${publishResult.id}`;
          }

          publishedUrls.push(postUrl);
        }

        if (publishSuccess) {
          // Update status to published
          await supabase
            .from('content_calendar')
            .update({
              status: 'published',
              published_url: publishedUrls.join(', '),
              publish_attempts: post.publish_attempts + 1,
            })
            .eq('id', post.id);

          results.published++;
          console.log(`  ✅ Published: ${post.id} → ${publishedUrls.join(', ')}`);
        } else {
          // Partial failure
          await supabase
            .from('content_calendar')
            .update({
              status: 'failed',
              publish_error: 'One or more platforms failed to publish',
              publish_attempts: post.publish_attempts + 1,
            })
            .eq('id', post.id);
          results.failed++;
        }

      } catch (err: any) {
        console.error(`  ❌ Error publishing post ${post.id}:`, err.message);

        // Mark as failed
        await supabase
          .from('content_calendar')
          .update({
            status: 'failed',
            publish_error: err.message,
            publish_attempts: post.publish_attempts + 1,
          })
          .eq('id', post.id);

        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      message: `Processed ${results.total} posts: ${results.published} published, ${results.failed} failed`,
    });

  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
