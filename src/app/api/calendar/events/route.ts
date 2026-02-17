// Calendar Events API - GET and POST endpoints
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const contactId = searchParams.get('contactId')
    const listingId = searchParams.get('listingId')
    const eventType = searchParams.get('type')
    const status = searchParams.get('status')

    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Build query
    let query = supabaseAdmin
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time', { ascending: true })

    // Apply date range filter
    if (start) {
      query = query.gte('start_time', start)
    }
    if (end) {
      query = query.lte('end_time', end)
    }

    // Apply optional filters
    if (contactId) {
      query = query.eq('contact_id', contactId)
    }
    if (listingId) {
      query = query.eq('listing_id', listingId)
    }
    if (eventType) {
      query = query.eq('event_type', eventType)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('Error fetching calendar events:', error)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    return NextResponse.json({ events: events || [] })
  } catch (error) {
    console.error('Error in calendar events GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      event_type,
      start_time,
      end_time,
      all_day,
      location,
      contact_id,
      listing_id,
      task_id,
      status,
      priority,
      reminder_minutes_before,
      reminder_sent
    } = body

    // Validate required fields
    if (!title || !start_time || !event_type) {
      return NextResponse.json(
        { error: 'Title, start time, and event type are required' },
        { status: 400 }
      )
    }

    // Create the event
    const { data: event, error } = await supabaseAdmin
      .from('calendar_events')
      .insert({
        user_id: user.id,
        title,
        description,
        event_type,
        start_time,
        end_time,
        all_day: all_day || false,
        location,
        contact_id,
        listing_id,
        task_id,
        status: status || 'scheduled',
        priority: priority || 'medium',
        reminder_minutes_before,
        reminder_sent: reminder_sent || false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating calendar event:', error)
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
    }

    // If reminder is set, create reminder record
    if (reminder_minutes_before && reminder_minutes_before > 0) {
      const reminderTime = new Date(new Date(start_time).getTime() - (reminder_minutes_before * 60 * 1000))
      
      await supabaseAdmin
        .from('event_reminders')
        .insert({
          event_id: event.id,
          reminder_time: reminderTime.toISOString(),
          reminder_type: 'notification',
          is_sent: false
        })
    }

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('Error in calendar events POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
