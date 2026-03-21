// Calendar Events API - GET and POST endpoints
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Initialize Supabase client with anon key for auth verification
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Helper to get user from Authorization header
async function getUserFromAuthHeader(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.replace('Bearer ', '')
  const client = createClient(supabaseUrl, supabaseAnonKey)

  try {
    const { data: { user }, error } = await client.auth.getUser(token)
    if (error || !user) {
      return null
    }
    return user
  } catch (err) {
    console.error('Auth header verification error:', err)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('=== CALENDAR API GET DEBUG ===')
    const searchParams = request.nextUrl.searchParams
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const contactId = searchParams.get('contactId')
    const listingId = searchParams.get('listingId')
    const eventType = searchParams.get('type')
    const status = searchParams.get('status')

    console.log('Query params:', { start, end, contactId, listingId, eventType, status })

    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    console.log('Auth header present:', !!authHeader)
    
    if (!authHeader) {
      console.log('No auth header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user using the helper function
    const user = await getUserFromAuthHeader(authHeader)
    console.log('Auth result:', { userId: user?.id })

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Build query
    let query = supabase
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

    console.log('Executing query...')
    const { data: events, error } = await query

    if (error) {
      console.error('Error fetching calendar events:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch events', 
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 })
    }

    console.log('Query successful, events count:', events?.length || 0)
    return NextResponse.json({ events: events || [] })
  } catch (error: any) {
    console.error('Error in calendar events GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error?.message || 'Unknown error',
      stack: error?.stack
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== CALENDAR API POST DEBUG ===')
    
    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    console.log('Auth header present:', !!authHeader)
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user using the helper function
    const user = await getUserFromAuthHeader(authHeader)
    console.log('Auth result:', { userId: user?.id })

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
      console.log('Request body:', JSON.stringify(body, null, 2))
    } catch (parseError: any) {
      console.error('Failed to parse JSON:', parseError)
      return NextResponse.json({ 
        error: 'Invalid JSON in request body',
        details: parseError?.message
      }, { status: 400 })
    }

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
      console.log('Validation failed:', { title, start_time, event_type })
      return NextResponse.json(
        { error: 'Title, start time, and event type are required' },
        { status: 400 }
      )
    }

    console.log('Inserting event with data:', {
      user_id: user.id,
      title,
      description,
      event_type,
      start_time,
      end_time,
      all_day: all_day || false,
      location,
      status: status || 'scheduled',
      priority: priority || 'normal'
    })

    // Create the event
    const { data: event, error } = await supabase
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
        priority: priority || 'normal',
        reminder_minutes_before,
        reminder_sent: reminder_sent || false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating calendar event:', error)
      // Return more detailed error information
      return NextResponse.json({ 
        error: 'Failed to create event', 
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 })
    }

    console.log('Event created successfully:', event.id)

    // If reminder is set, create reminder record
    if (reminder_minutes_before && reminder_minutes_before > 0) {
      const reminderTime = new Date(new Date(start_time).getTime() - (reminder_minutes_before * 60 * 1000))
      
      await supabase
        .from('event_reminders')
        .insert({
          event_id: event.id,
          reminder_time: reminderTime.toISOString(),
          reminder_type: 'notification',
          is_sent: false
        })
    }

    return NextResponse.json({ event }, { status: 201 })
  } catch (error: any) {
    console.error('Error in calendar events POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error',
      stack: error?.stack
    }, { status: 500 })
  }
}
