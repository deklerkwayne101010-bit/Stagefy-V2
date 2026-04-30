// Social Accounts API - Connect Facebook/Instagram accounts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Meta OAuth configuration (will be set in env vars)
const META_APP_ID = process.env.META_APP_ID || 'your_app_id';
const META_APP_SECRET = process.env.META_APP_SECRET || 'your_app_secret';
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || 'http://localhost:3000/api/social/accounts/callback';

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

// GET /api/social/accounts - List connected accounts
export async function GET(request: Request) {
  try {
    const user = await getUserFromAuthHeader(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching social accounts:', error);
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    // Don't return access tokens in response
    const sanitized = (data || []).map(account => ({
      id: account.id,
      platform: account.platform,
      account_name: account.account_name,
      page_id: account.page_id,
      token_type: account.token_type,
      expires_at: account.expires_at,
      is_active: account.is_active,
      permissions: account.permissions,
    }));

    return NextResponse.json({ accounts: sanitized });

  } catch (error: any) {
    console.error('Social accounts GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/social/accounts/connect - Initiate OAuth flow
export async function POST(request: Request) {
  try {
    const user = await getUserFromAuthHeader(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { platform } = body;

    if (!platform || !['facebook', 'instagram'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be "facebook" or "instagram"' },
        { status: 400 }
      );
    }

    // Build OAuth URL
    // For Facebook, we need to request Page permissions
    const scopes = [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'instagram_basic',
      'instagram_content_publish',
    ].join(',');

    const state = Buffer.from(JSON.stringify({
      user_id: user.id,
      platform,
      timestamp: Date.now(),
    })).toString('base64');

    const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&state=${encodeURIComponent(state)}` +
      `&response_type=code`;

    return NextResponse.json({
      auth_url: oauthUrl,
      message: 'Redirect user to this URL to authorize',
    });

  } catch (error: any) {
    console.error('Social connect POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/social/accounts/callback - OAuth callback handler
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
      `client_id=${META_APP_ID}` +
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

    // For MVP: use first page
    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.json(
        { error: 'No Facebook Pages found. Please create a Facebook Page first.' },
        { status: 400 }
      );
    }

    const page = pagesData.data[0];
    const pageId = page.id;
    const pageName = page.name;

    // For Instagram, we need to get Instagram Business Account ID
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
    const { error: insertError } = await supabase
      .from('social_accounts')
      .upsert({
        user_id: user_id,
        platform,
        account_name: pageName,
        page_id: platform === 'facebook' ? pageId : instagramAccountId || pageId,
        access_token,
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

// DELETE /api/social/accounts/[platform] - Disconnect account
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const user = await getUserFromAuthHeader(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { platform } = await params;

    if (!['facebook', 'instagram'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('social_accounts')
      .delete()
      .eq('user_id', user.id)
      .eq('platform', platform);

    if (error) {
      console.error('Error disconnecting account:', error);
      return NextResponse.json({ error: 'Failed to disconnect account' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Account delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
