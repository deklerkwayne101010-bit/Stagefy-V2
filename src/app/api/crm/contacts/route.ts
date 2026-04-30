// CRM Contacts API - GET (list), POST (create)
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Helper to get user from Authorization header
async function getUserFromAuthHeader(request: Request) {
  const authHeader = request.headers.get('Authorization')
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
  } catch {
    return null
  }
}

// GET - List contacts
export async function GET(request: Request) {
  try {
    const user = await getUserFromAuthHeader(request)
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || 'all'
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '100')

    // Use the user's token for RLS-protected queries
    const authHeader = request.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    let query = supabase
      .from('crm_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }
    
    if (type && type !== 'all') {
      query = query.eq('contact_type', type)
    }
    
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: contacts, error } = await query

    if (error) {
      console.error('Error fetching contacts:', error)
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
    }

    return NextResponse.json({ contacts: contacts || [], total: contacts?.length || 0 })
  } catch (error) {
    console.error('Contacts API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create contact
export async function POST(request: Request) {
  try {
    const user = await getUserFromAuthHeader(request)
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      contact_type,
      status,
      notes,
      address,
      company,
      preferred_locations,
      budget_min,
      budget_max,
      property_types_interest,
      bedrooms_required,
      bathrooms_required,
      features_required,
      timeline,
      source,
      preferred_contact_method,
      rating
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Use the user's token for RLS-protected queries
    const authHeader = request.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    // Build insert object with only valid columns
    const insertData: Record<string, any> = {
      user_id: user.id,
      name,
      email,
      phone,
      type: contact_type || 'buyer', // DB column is 'type', not 'contact_type'
      status: status || 'lead',
      notes,
      tags: [],
    }

    // Optional columns - only include if the migration has been run
    if (preferred_locations) insertData.preferred_locations = preferred_locations
    if (budget_min) insertData.budget_min = budget_min
    if (budget_max) insertData.budget_max = budget_max
    if (property_types_interest) insertData.property_types_interest = property_types_interest
    if (bedrooms_required) insertData.bedrooms_required = bedrooms_required
    if (bathrooms_required) insertData.bathrooms_required = bathrooms_required
    if (features_required) insertData.features_required = features_required
    if (timeline) insertData.timeline = timeline
    if (source) insertData.source = source
    if (preferred_contact_method) insertData.preferred_contact_method = preferred_contact_method
    if (rating) insertData.rating = rating

    const { data: contact, error } = await supabase
      .from('crm_contacts')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating contact:', error)
      return NextResponse.json({ error: error.message || 'Failed to create contact' }, { status: 500 })
    }

    return NextResponse.json({ contact }, { status: 201 })
  } catch (error) {
    console.error('Create contact error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
