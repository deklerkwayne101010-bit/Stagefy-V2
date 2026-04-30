// Disconnect a specific social media account
import { NextResponse } from 'next/server'
import { getCurrentUser, supabase } from '@/lib/supabase'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { platform } = await params
    if (!['facebook', 'instagram'].includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }

    // Deactivate (soft delete) the social account for this user
    const { error } = await supabase
      .from('social_accounts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('platform', platform)

    if (error) {
      console.error('Error disconnecting account:', error)
      return NextResponse.json({ error: 'Failed to disconnect account' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully disconnected ${platform} account`,
    })
  } catch (error) {
    console.error('Disconnect account error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
