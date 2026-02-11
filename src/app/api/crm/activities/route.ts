// CRM Activities API Route
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contact_id')
    const listingId = searchParams.get('listing_id')
    const activityType = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get current user
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Build query
    let query = supabase
      .from('crm_activities')
      .select(`
        *,
        contacts:crm_contacts(id, name, email, phone),
        listings:crm_listings(id, address, city)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (contactId) {
      query = query.eq('contact_id', contactId)
    }
    if (listingId) {
      query = query.eq('listing_id', listingId)
    }
    if (activityType) {
      query = query.eq('activity_type', activityType)
    }

    const { data: activities, error } = await query

    if (error) {
      console.error('Error fetching activities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch activities' },
        { status: 500 }
      )
    }

    // Get activity counts for stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count: todayCount } = await supabase
      .from('crm_activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())

    const { count: callsCount } = await supabase
      .from('crm_activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('activity_type', 'call')
      .gte('created_at', today.toISOString())

    const { count: emailsCount } = await supabase
      .from('crm_activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('activity_type', 'email')
      .gte('created_at', today.toISOString())

    return NextResponse.json({
      activities: activities || [],
      stats: {
        today: todayCount || 0,
        calls: callsCount || 0,
        emails: emailsCount || 0,
      },
    })
  } catch (error) {
    console.error('Activities API error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching activities' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      activity_type,
      subject,
      content,
      direction,
      duration,
      outcome,
      next_action,
      contact_id,
      listing_id,
    } = body

    // Validate required fields
    if (!activity_type || !content) {
      return NextResponse.json(
        { error: 'Activity type and content are required' },
        { status: 400 }
      )
    }

    // Get current user
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Insert activity
    const { data: activity, error } = await supabase
      .from('crm_activities')
      .insert({
        user_id: user.id,
        activity_type,
        subject: subject || null,
        content,
        direction: direction || 'outbound',
        duration: duration || null,
        outcome: outcome || null,
        next_action: next_action || null,
        contact_id: contact_id || null,
        listing_id: listing_id || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating activity:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create activity' },
        { status: 500 }
      )
    }

    // Update last_contacted_at on contact if this is a communication activity
    const communicationTypes = ['call', 'email', 'sms', 'whatsapp', 'meeting', 'showing']
    if (contact_id && communicationTypes.includes(activity_type)) {
      await supabase
        .from('crm_contacts')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', contact_id)
        .eq('user_id', user.id)
    }

    // Increment inquiry_count on listing if inbound inquiry
    if (listing_id && direction === 'inbound') {
      const { data: listing } = await supabase
        .from('crm_listings')
        .select('inquiry_count')
        .eq('id', listing_id)
        .single()
      
      if (listing) {
        await supabase
          .from('crm_listings')
          .update({ inquiry_count: (listing.inquiry_count || 0) + 1 })
          .eq('id', listing_id)
      }
    }

    return NextResponse.json({ activity }, { status: 201 })
  } catch (error) {
    console.error('Create activity error:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating activity' },
      { status: 500 }
    )
  }
}
