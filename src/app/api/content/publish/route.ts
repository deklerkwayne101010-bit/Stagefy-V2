// Content Publishing API - Publish to Facebook/Instagram
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Helper to get user from Authorization header
async function getUserFromAuthHeader(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

// POST /api/content/publish/facebook
export async function POST_Facebook(
  request: Request,
  { params }: { params: Promise<{ content_id: string }> }
) {
  try {
    const user = await getUserFromAuthHeader(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { content_id } = await params;
    const body = await request.json();
    const { message, image_url, page_id: requestedPageId } = body;

    if (!message || !image_url) {
      return NextResponse.json(
        { error: 'Missing required fields: message, image_url' },
        { status: 400 }
      );
    }

    // Get content entry
    const { data: content, error: contentError } = await supabase
      .from('content_calendar')
      .select('*')
      .eq('id', content_id)
      .eq('user_id', user.id)
      .single();

    if (contentError || !content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Get social account
    let pageId = requestedPageId;
    if (!pageId) {
      const { data: account } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'facebook')
        .eq('is_active', true)
        .single();

      if (!account) {
        return NextResponse.json(
          { error: 'No Facebook account connected. Please connect your Facebook Page first.' },
          { status: 400 }
        );
      }
      pageId = account.page_id;
    }

    // Publish to Facebook using Graph API
    // First upload the photo, then publish
    const formData = new FormData();
    formData.append('url', image_url);
    formData.append('caption', message);
    formData.append('published', 'true');

    const fbResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/photos`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.META_APP_TOKEN || 'temp'}`,
        },
        body: formData,
      }
    );

    const fbResult = await fbResponse.json();

    if (!fbResponse.ok) {
      console.error('Facebook API error:', fbResult);
      throw new Error(`Facebook API error: ${fbResult.error?.message || 'Unknown error'}`);
    }

    // Update content calendar with published URL
    const postUrl = `https://www.facebook.com/${fbResult.id}`;
    await supabase
      .from('content_calendar')
      .update({
        status: 'published',
        published_url: postUrl,
        publish_attempts: content.publish_attempts + 1,
      })
      .eq('id', content_id);

    return NextResponse.json({
      success: true,
      post_url: postUrl,
      platform: 'facebook',
    });

  } catch (error: any) {
    console.error('Facebook publish error:', error);

    // Mark as failed
    await supabase
      .from('content_calendar')
      .update({
        status: 'failed',
        publish_error: error.message,
        publish_attempts: supabase.rpc('increment_publish_attempts', { id: content_id }),
      })
      .eq('id');

    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}

// POST /api/content/publish/instagram
export async function POST_Instagram(
  request: Request,
  { params }: { params: Promise<{ content_id: string }> }
) {
  try {
    const user = await getUserFromAuthHeader(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { content_id } = await params;
    const body = await request.json();
    const { caption, image_url, instagram_account_id: requestedAccountId } = body;

    if (!caption || !image_url) {
      return NextResponse.json(
        { error: 'Missing required fields: caption, image_url' },
        { status: 400 }
      );
    }

    // Get content entry
    const { data: content, error: contentError } = await supabase
      .from('content_calendar')
      .select('*')
      .eq('id', content_id)
      .eq('user_id', user.id)
      .single();

    if (contentError || !content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Get Instagram Business Account
    let igAccountId = requestedAccountId;
    if (!igAccountId) {
      const { data: account } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'instagram')
        .eq('is_active', true)
        .single();

      if (!account) {
        return NextResponse.json(
          { error: 'No Instagram account connected. Please connect your Instagram Business account first.' },
          { status: 400 }
        );
      }
      igAccountId = account.page_id; // page_id stores Instagram Business Account ID
    }

    // Instagram publishing: 2-step process
    // Step 1: Create media container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/media`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.META_APP_TOKEN || 'temp'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url,
          caption,
          media_type: 'IMAGE',
        }),
      }
    );

    const containerResult = await containerResponse.json();

    if (!containerResponse.ok) {
      console.error('Instagram container error:', containerResult);
      throw new Error(`Instagram API error: ${containerResult.error?.message || 'Unknown error'}`);
    }

    const creationId = containerResult.id;

    // Step 2: Publish the container
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.META_APP_TOKEN || 'temp'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creation_id: creationId,
        }),
      }
    );

    const publishResult = await publishResponse.json();

    if (!publishResponse.ok) {
      console.error('Instagram publish error:', publishResult);
      throw new Error(`Instagram publish error: ${publishResult.error?.message || 'Unknown error'}`);
    }

    // Update content calendar
    const postUrl = `https://www.instagram.com/p/${publishResult.id}`;
    await supabase
      .from('content_calendar')
      .update({
        status: 'published',
        published_url: postUrl,
        publish_attempts: content.publish_attempts + 1,
      })
      .eq('id', content_id);

    return NextResponse.json({
      success: true,
      post_url: postUrl,
      platform: 'instagram',
    });

  } catch (error: any) {
    console.error('Instagram publish error:', error);

    await supabase
      .from('content_calendar')
      .update({
        status: 'failed',
        publish_error: error.message,
      })
      .eq('id');

    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}
