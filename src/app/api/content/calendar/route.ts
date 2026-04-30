// Content Calendar API - List and Create entries
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

// GET all calendar entries for authenticated user
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const platform = searchParams.get('platform')

    let query = supabase
      .from('content_calendar')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_for', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }
    if (startDate) {
      query = query.gte('scheduled_for', startDate)
    }
    if (endDate) {
      query = query.lte('scheduled_for', endDate)
    }
    if (platform) {
      query = query.eq('platform', platform)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching calendar:', error)
      return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Calendar GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST new calendar entry
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      caption,
      image_url,
      platform,
      scheduled_for,
      is_recurring,
      recurrence_rule,
      recurrence_end_date,
      visual_type,
    } = body

    // Validate required fields
    if (!title || !caption || !platform || !scheduled_for) {
      return NextResponse.json(
        { error: 'Missing required fields: title, caption, platform, scheduled_for' },
        { status: 400 }
      )
    }

    if (!['facebook', 'instagram', 'both'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be facebook, instagram, or both' },
        { status: 400 }
      )
    }

    // Insert new calendar entry
    const { data, error } = await supabase
      .from('content_calendar')
      .insert({
        user_id: user.id,
        title,
        caption,
        image_url: image_url || null,
        platform,
        scheduled_for: new Date(scheduled_for).toISOString(),
        status: 'scheduled',
        is_recurring: is_recurring || false,
        recurrence_rule: recurrence_rule || null,
        recurrence_end_date: recurrence_end_date ? new Date(recurrence_end_date).toISOString() : null,
        visual_type: visual_type || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating calendar entry:', error)
      return NextResponse.json({ error: 'Failed to create calendar entry' }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Calendar POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
