// Agent Profile API Route
// Phase 2: Agent Profile CRUD operations

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'
import { supabase, getAdminClient } from '@/lib/supabase'

// Check if running in demo mode
const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function GET() {
  try {
    let userId: string | null = null

    if (!isDemoMode) {
      const user = await getCurrentUser()
      if (!user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      userId = user.id
    }

    // Demo mode: return mock data
    if (isDemoMode) {
      return NextResponse.json({
        data: {
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
        data: null,
        message: 'No agent profile found. Create one to get started.',
      })
    }

    return NextResponse.json({ data })
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

    if (!isDemoMode) {
      const user = await getCurrentUser()
      if (!user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      userId = user.id
    }

    const body = await request.json()

    // Demo mode
    if (isDemoMode) {
      return NextResponse.json({
        data: {
          id: 'demo-agent-id',
          user_id: 'demo-user-id',
          ...body,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        demo: true,
        demoMessage: 'Demo mode: Profile saved (not persisted)',
      })
    }

    const adminClient = getAdminClient()

    // Check if profile exists
    const { data: existing } = await supabase
      .from('agent_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    let result

    if (existing) {
      // Update existing profile
      const { data, error } = await (adminClient.from as any)
        .from('agent_profiles')
        .update({
          ...body,
          user_id: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating agent profile:', error)
        return NextResponse.json(
          { error: 'Failed to update agent profile' },
          { status: 500 }
        )
      }
      result = data
    } else {
      // Create new profile
      const { data, error } = await (adminClient.from as any)
        .from('agent_profiles')
        .insert({
          ...body,
          user_id: userId,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating agent profile:', error)
        return NextResponse.json(
          { error: 'Failed to create agent profile' },
          { status: 500 }
        )
      }
      result = data
    }

    return NextResponse.json({
      data: result,
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

    if (!isDemoMode) {
      const user = await getCurrentUser()
      if (!user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      userId = user.id
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      )
    }

    // Demo mode
    if (isDemoMode) {
      return NextResponse.json({
        data: {
          id,
          user_id: 'demo-user-id',
          ...updateData,
          updated_at: new Date().toISOString(),
        },
        demo: true,
      })
    }

    const adminClient = getAdminClient()

    const { data, error } = await (adminClient.from as any)
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
      data,
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

    if (!isDemoMode) {
      const user = await getCurrentUser()
      if (!user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      userId = user.id
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      )
    }

    // Demo mode
    if (isDemoMode) {
      return NextResponse.json({
        success: true,
        demo: true,
        demoMessage: 'Demo mode: Profile not actually deleted',
      })
    }

    const adminClient = getAdminClient()

    const { error } = await (adminClient.from as any)
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
