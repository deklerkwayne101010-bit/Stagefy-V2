// CRM Contacts API - GET (list), POST (create)
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

// GET - List contacts
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || 'all'
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '100')

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
    const user = await getCurrentUser()
    
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

    const { data: contact, error } = await supabase
      .from('crm_contacts')
      .insert({
        user_id: user.id,
        name,
        email,
        phone,
        contact_type: contact_type || 'buyer',
        status: status || 'lead',
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
        rating: rating || 3
      })
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
