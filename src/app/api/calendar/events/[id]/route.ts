// Calendar Event by ID API Route
// Phase 1: Update and delete individual events

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Helper to get user from Authorization header
async function getUserFromAuthHeader(authHeader: string | null): Promise<{ id: string; email: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.replace('Bearer ', '')
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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('Authorization')
    const user = await getUserFromAuthHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: eventId } = await params
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
      recurrence_rule,
      reminder_minutes
    } = body

    // Update the event
    const { data: event, error } = await supabase
      .from('calendar_events')
      .update({
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
        recurrence_rule,
        reminder_minutes,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .eq('user_id', user.id) // Ensure user owns the event
      .select(`
        *,
        contact:crm_contacts(id, name, email, phone),
        listing:crm_listings(id, title, address),
        task:crm_tasks(id, title, status)
      `)
      .single()

    if (error) {
      console.error('Error updating calendar event:', error)
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
    }

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Calendar event update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('Authorization')
    const user = await getUserFromAuthHeader(authHeader)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: eventId } = await params

    // Delete the event (reminders will be deleted automatically due to CASCADE)
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', user.id) // Ensure user owns the event

    if (error) {
      console.error('Error deleting calendar event:', error)
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Calendar event delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}