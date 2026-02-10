// API route for Agent Profile operations
import { NextResponse } from 'next/server'
import { supabase, getCurrentUser } from '@/lib/supabase'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('agent_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching agent profile:', error)
      return NextResponse.json(
        { error: 'Failed to fetch agent profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile: data || null })
  } catch (error) {
    console.error('Agent profile GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { name_surname, email, phone, photo_url, logo_url } = await request.json()

    if (!name_surname || !email || !phone) {
      return NextResponse.json(
        { error: 'Name/Surname, Email, and Phone are required' },
        { status: 400 }
      )
    }

    // Check if profile exists
    const { data: existing } = await supabase
      .from('agent_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let result
    if (existing) {
      // Update existing profile
      const { data, error } = await supabase
        .from('agent_profiles')
        .update({
          name_surname,
          email,
          phone,
          photo_url,
          logo_url,
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
      // Insert new profile
      const { data, error } = await supabase
        .from('agent_profiles')
        .insert({
          user_id: user.id,
          name_surname,
          email,
          phone,
          photo_url,
          logo_url,
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
      success: true, 
      profile: result,
      message: 'Agent profile saved successfully'
    })
  } catch (error) {
    console.error('Agent profile POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
