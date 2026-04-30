// OAuth callback handler for Facebook/Instagram connection
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const META_APP_SECRET = process.env.META_APP_SECRET;
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || 'http://localhost:3000/api/social/accounts/callback';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.json(
        { error: 'OAuth failed', details: error },
        { status: 400 }
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state parameter' },
        { status: 400 }
      );
    }

    // Decode state
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }

    const { user_id, platform } = stateData;

    if (!user_id || !platform) {
      return NextResponse.json(
        { error: 'Invalid state data' },
        { status: 400 }
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${process.env.META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}` +
      `&client_secret=${META_APP_SECRET}` +
      `&code=${code}`,
      { method: 'GET' }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange error:', tokenData);
      return NextResponse.json(
        { error: 'Failed to exchange code for token', details: tokenData },
        { status: 500 }
      );
    }

    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    // Get user's Facebook pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`,
      { method: 'GET' }
    );

    const pagesData = await pagesResponse.json();

    if (!pagesResponse.ok) {
      console.error('Pages fetch error:', pagesData);
      return NextResponse.json(
        { error: 'Failed to fetch pages', details: pagesData },
        { status: 500 }
      );
    }

    // Use first page
    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.json(
        { error: 'No Facebook Pages found. Please create a Facebook Page first.' },
        { status: 400 }
      );
    }

    const page = pagesData.data[0];
    const pageId = page.id;
    const pageName = page.name;

    // Get Instagram Business Account ID if platform is instagram
    let instagramAccountId = null;
    if (platform === 'instagram') {
      const igResponse = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`,
        { method: 'GET' }
      );
      const igData = await igResponse.json();

      if (igData.instagram_business_account) {
        instagramAccountId = igData.instagram_business_account.id;
      }
    }

    // Store in database
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error: insertError } = await supabase
      .from('social_accounts')
      .upsert({
        user_id: user_id,
        platform,
        account_name: pageName,
        page_id: platform === 'facebook' ? pageId : instagramAccountId || pageId,
        access_token: accessToken,
        token_type: 'page',
        expires_at: expiresIn?.toISOString(),
        is_active: true,
        permissions: {
          pages_show_list: true,
          pages_read_engagement: true,
          pages_manage_posts: true,
          instagram_basic: platform === 'instagram',
          instagram_content_publish: platform === 'instagram',
        },
      }, {
        onConflict: 'user_id,platform',
      });

    if (insertError) {
      console.error('Error storing social account:', insertError);
      return NextResponse.json(
        { error: 'Failed to save account' },
        { status: 500 }
      );
    }

    // Redirect to frontend with success
    const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      new URL(`${frontendUrl}/calendar?social_connected=true`, 'http://localhost:3000')
    );

  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
