// Agent Profile API Route
// Phase 2: Agent Profile CRUD operations

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase, getAdminClient } from '@/lib/supabase'

// Check if running in demo mode
const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Helper to get user from Authorization header
async function getUserFromAuthHeader(authHeader: string | null): Promise<{ id: string; email: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.replace('Bearer ', '')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }
  
  // Create a temporary client to verify the token
  const client = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    const { data: { user }, error } = await client.auth.getUser(token)
    if (error || !user) {
      console.error('Token verification error:', error)
      return null
    }
    return { id: user.id, email: user.email || '' }
  } catch (err) {
    console.error('Auth header verification error:', err)
    return null
  }
}

export async function GET(request: Request) {
  try {
    let userId: string | null = null

    // Check if Supabase is configured
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (isSupabaseConfigured) {
      // Try to get user from Authorization header first
      const authHeader = request.headers.get('Authorization')
      const userFromHeader = await getUserFromAuthHeader(authHeader)
      
      if (userFromHeader) {
        userId = userFromHeader.id
      } else {
        // Fallback to getCurrentUser (for backward compatibility)
        try {
          const { getCurrentUser } = await import('@/lib/supabase')
          const user = await getCurrentUser()
          userId = user?.id || null
        } catch (authError) {
          console.error('Auth error:', authError)
        }
      }
    }

    // Demo mode or not authenticated: return mock data
    if (!userId || isDemoMode) {
      return NextResponse.json({
        profile: {
          id: 'demo-agent-id',
          user_id: 'demo-user-id',
          name_surname: 'Demo Agent',
          email: 'demo@stagefy.co.za',
          phone: '+27 82 123 4567',
          photo_url: null,
          logo_url: null,
          agency_brand: 'remax',
          license_number: 'REQ-12345',
          years_experience: 5,
          specializations: ['Luxury Homes', 'Residential'],
          awards: ['Top Agent 2024'],
          bio: 'Professional real estate agent with 5+ years experience.',
          website: 'https://demo-agent.co.za',
          facebook: null,
          instagram: null,
          linkedin: null,
          show_on_templates: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        demo: true,
      })
    }

    // Real mode: fetch from Supabase
    const { data, error } = await supabase
      .from('agent_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching agent profile:', error)
      return NextResponse.json(
        { error: 'Failed to fetch agent profile' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json({
        profile: null,
        message: 'No agent profile found. Create one to get started.',
      })
    }

    return NextResponse.json({ profile: data })
  } catch (error) {
    console.error('Agent profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    let userId: string | null = null

    // Check if Supabase is configured
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (isSupabaseConfigured) {
      // Try to get user from Authorization header first
      const authHeader = request.headers.get('Authorization')
      const userFromHeader = await getUserFromAuthHeader(authHeader)
      
      if (userFromHeader) {
        userId = userFromHeader.id
      } else {
        // Fallback to getCurrentUser (for backward compatibility)
        try {
          const { getCurrentUser } = await import('@/lib/supabase')
          const user = await getCurrentUser()
          userId = user?.id || null
        } catch (authError) {
          console.error('Auth error:', authError)
        }
      }
    }

    const body = await request.json()

    // Handle base64 images
    const { photo_url, logo_url, ...restBody } = body

    // If no user ID (not authenticated or demo mode), return demo response
    if (!userId || isDemoMode) {
      return NextResponse.json({
        profile: {
          id: 'demo-agent-id',
          user_id: 'demo-user-id',
          name_surname: restBody.name_surname || '',
          email: restBody.email || '',
          phone: restBody.phone || '',
          photo_url: photo_url,
          logo_url: logo_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        demo: true,
        demoMessage: 'Profile saved (demo mode)',
      })
    }

    // Real mode - save to Supabase
    const adminClient = getAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Admin client not configured' },
        { status: 500 }
      )
    }

    // Check if profile exists
    const { data: existing } = await supabase
      .from('agent_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    let result

    if (existing) {
      // Update existing profile
      const { data, error } = await (adminClient as any)
        .from('agent_profiles')
        .update({
          ...restBody,
          photo_url,
          logo_url,
          user_id: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating agent profile:', error)
        return NextResponse.json(
          { error: 'Failed to update agent profile: ' + error.message },
          { status: 500 }
        )
      }
      result = data
    } else {
      // Create new profile
      const { data, error } = await (adminClient as any)
        .from('agent_profiles')
        .insert({
          ...restBody,
          photo_url,
          logo_url,
          user_id: userId,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating agent profile:', error)
        return NextResponse.json(
          { error: 'Failed to create agent profile: ' + error.message },
          { status: 500 }
        )
      }
      result = data
    }

    return NextResponse.json({
      profile: result,
      message: 'Agent profile saved successfully',
    })
  } catch (error) {
    console.error('Agent profile save error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    let userId: string | null = null

    // Check if Supabase is configured
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (isSupabaseConfigured) {
      // Try to get user from Authorization header first
      const authHeader = request.headers.get('Authorization')
      const userFromHeader = await getUserFromAuthHeader(authHeader)
      
      if (userFromHeader) {
        userId = userFromHeader.id
      } else {
        // Fallback to getCurrentUser (for backward compatibility)
        try {
          const { getCurrentUser } = await import('@/lib/supabase')
          const user = await getCurrentUser()
          userId = user?.id || null
        } catch (authError) {
          console.error('Auth error:', authError)
        }
      }
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      )
    }

    // Demo mode or not authenticated
    if (!userId || isDemoMode) {
      return NextResponse.json({
        profile: {
          id,
          user_id: 'demo-user-id',
          ...updateData,
          updated_at: new Date().toISOString(),
        },
        demo: true,
      })
    }

    const adminClient = getAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Admin client not configured' },
        { status: 500 }
      )
    }

    const { data, error } = await (adminClient as any)
      .from('agent_profiles')
      .update({
        ...updateData,
        user_id: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating agent profile:', error)
      return NextResponse.json(
        { error: 'Failed to update agent profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      profile: data,
      message: 'Agent profile updated successfully',
    })
  } catch (error) {
    console.error('Agent profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    let userId: string | null = null

    // Check if Supabase is configured
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (isSupabaseConfigured) {
      // Try to get user from Authorization header first
      const authHeader = request.headers.get('Authorization')
      const userFromHeader = await getUserFromAuthHeader(authHeader)
      
      if (userFromHeader) {
        userId = userFromHeader.id
      } else {
        // Fallback to getCurrentUser (for backward compatibility)
        try {
          const { getCurrentUser } = await import('@/lib/supabase')
          const user = await getCurrentUser()
          userId = user?.id || null
        } catch (authError) {
          console.error('Auth error:', authError)
        }
      }
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      )
    }

    // Demo mode or not authenticated
    if (!userId || isDemoMode) {
      return NextResponse.json({
        success: true,
        demo: true,
        demoMessage: 'Demo mode: Profile not actually deleted',
      })
    }

    const adminClient = getAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Admin client not configured' },
        { status: 500 }
      )
    }

    const { error } = await (adminClient as any)
      .from('agent_profiles')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting agent profile:', error)
      return NextResponse.json(
        { error: 'Failed to delete agent profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Agent profile deleted successfully',
    })
  } catch (error) {
    console.error('Agent profile delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
