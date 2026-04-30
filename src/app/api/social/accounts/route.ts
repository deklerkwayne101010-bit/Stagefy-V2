// Social Accounts API - Connect Facebook/Instagram accounts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Meta OAuth configuration
const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
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
// GET /api/social/accounts/callback - OAuth callback (handled by separate file)
export async function GET(request: Request) {
  try {
    const user = await getUserFromAuthHeader(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data, error } = await createClient(supabaseUrl, supabaseAnonKey)
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching social accounts:', error);
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    // Don't return access tokens
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

// POST /api/social/accounts - Initiate OAuth connection
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

// DELETE /api/social/accounts/[platform] - Disconnect account
// This will be handled by a separate route file with [platform] dynamic segment
export async function DELETE(request: Request) {
  try {
    const user = await getUserFromAuthHeader(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get platform from URL query param for simplicity
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    if (!platform || !['facebook', 'instagram'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      );
    }

    const { error } = await createClient(supabaseUrl, supabaseAnonKey)
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
