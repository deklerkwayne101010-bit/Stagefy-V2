// OAuth callback for Meta (Facebook/Instagram) authentication
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Handle OAuth error from Meta
    if (error) {
      console.error('OAuth error:', error, errorDescription)
      const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/calendar?oauth_error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`
      return NextResponse.redirect(redirectUrl)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/calendar?oauth_error=missing_code_or_state`)
    }

    // Verify state token
    const { data: stateRecord, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .single()

    if (stateError || !stateRecord) {
      console.error('Invalid or expired OAuth state:', state)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/calendar?oauth_error=invalid_state`)
    }

    const userId = stateRecord.user_id
    const platform = stateRecord.platform

    // Delete the used state to prevent replay
    await supabase.from('oauth_states').delete().eq('id', stateRecord.id)

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
        `client_id=${process.env.META_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/social/accounts/callback`)}` +
        `&client_secret=${process.env.META_APP_SECRET}` +
        `&code=${code}`,
      { method: 'GET' }
    )

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text()
      console.error('Token exchange failed:', tokenError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/calendar?oauth_error=token_exchange_failed`)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/calendar?oauth_error=no_access_token`)
    }

    // Get user's pages/accounts
    let accounts = []

    if (platform === 'facebook') {
      // Get pages the user manages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,access_token,instagram_business_account`,
        { method: 'GET' }
      )

      if (!pagesResponse.ok) {
        console.error('Failed to fetch Facebook pages')
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/calendar?oauth_error=failed_to_fetch_pages`)
      }

      const pagesData = await pagesResponse.json()
      accounts = (pagesData.data || []).map((page: any) => ({
        account_id: page.id,
        account_name: page.name,
        platform: 'facebook',
        access_token: page.access_token,
        // Check for linked Instagram
        has_instagram: !!page.instagram_business_account,
        instagram_id: page.instagram_business_account?.id,
      }))
    } else {
      // Instagram - need to get IG Business Account linked to a Facebook Page
      // First get user's pages (Instagram requires a Facebook Page)
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,instagram_business_account`,
        { method: 'GET' }
      )

      if (!pagesResponse.ok) {
        console.error('Failed to fetch pages for Instagram')
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/calendar?oauth_error=failed_to_fetch_instagram_accounts`)
      }

      const pagesJson = await pagesResponse.json()
      const pages = pagesJson.data || []

      // Extract Instagram accounts
      accounts = pages
        .filter((page: any) => page.instagram_business_account)
        .map((page: any) => ({
          account_id: page.instagram_business_account.id,
          account_name: `${page.name} (Instagram)`,
          platform: 'instagram',
          access_token: accessToken, // Use same token with Instagram permissions
          page_id: page.id,
        }))
    }

    if (accounts.length === 0) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/calendar?oauth_error=no_${platform}_accounts_found`)
    }

    // Save connected accounts to database
    const savedAccounts = []
    for (const account of accounts) {
      const { data, error } = await supabase
        .from('social_accounts')
        .upsert(
          {
            user_id: userId,
            platform: account.platform,
            account_id: account.account_id,
            account_name: account.account_name,
            access_token: account.access_token,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,platform,account_id',
          }
        )
        .select()
        .single()

      if (!error && data) {
        savedAccounts.push({
          id: data.id,
          platform: data.platform,
          account_name: data.account_name,
        })
      }
    }

    // Redirect to calendar page with success
    const redirectUrl = savedAccounts.length > 0
      ? `${process.env.NEXT_PUBLIC_APP_URL}/calendar?oauth_success=true&connected=${savedAccounts.map((a: any) => a.platform).join(',')}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/calendar?oauth_error=no_accounts_saved`

    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/calendar?oauth_error=internal_error`)
  }
}
