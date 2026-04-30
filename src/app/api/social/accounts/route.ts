// Social Accounts API - Manage connected Meta (Facebook/Instagram) accounts
import { NextResponse } from 'next/server'
import { getCurrentUser, supabase } from '@/lib/supabase'

// Generate cryptographically secure random string
function generateStateToken(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// GET list of connected social accounts for authenticated user
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data, error } = await (supabase as any)
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching social accounts:', error)
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
    }

    // Don't expose access tokens in response
    const safeData = (data || []).map((account: any) => ({
      id: account.id,
      platform: account.platform,
      account_id: account.account_id,
      account_name: account.account_name,
      is_active: account.is_active,
      created_at: account.created_at,
    }))

    return NextResponse.json({ data: safeData })
  } catch (error) {
    console.error('Social accounts GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - initiate OAuth flow for a platform
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { platform } = await request.json()

    if (!platform || !['facebook', 'instagram'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be facebook or instagram' },
        { status: 400 }
      )
    }

    // Generate state token for CSRF protection
    const state = generateStateToken()
    const { data: stateInsert, error: stateError } = await supabase
      .from('oauth_states')
      .insert({
        user_id: user.id,
        state,
        platform,
        created_at: new Date().toISOString(),
      })

    if (stateError) {
      console.error('Error creating OAuth state:', stateError)
      return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 })
    }

    // Build Meta OAuth URL
    const clientId = process.env.META_APP_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/social/accounts/callback`
    const scopes = platform === 'facebook'
      ? 'pages_show_list,pages_read_engagement,pages_manage_posts'
      : 'instagram_basic,instagram_content_publish'

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&response_type=code`

    return NextResponse.json({
      authUrl,
      state,
      platform,
    })
  } catch (error) {
    console.error('Social accounts POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
