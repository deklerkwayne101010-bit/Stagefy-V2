// CRM Listing API - GET, PUT, DELETE single listing
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function getUserFromAuthHeader(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.replace('Bearer ', '')
  const client = createClient(supabaseUrl, supabaseAnonKey)
  try {
    const { data: { user }, error } = await client.auth.getUser(token)
    if (error || !user) return null
    return user
  } catch { return null }
}

function getSupabaseClient(request: Request) {
  const authHeader = request.headers.get('Authorization') || ''
  const token = authHeader.replace('Bearer ', '')
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromAuthHeader(request)
    const { id } = await params
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: listing, error } = await getSupabaseClient(request)
      .from('crm_listings')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching listing:', error)
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    return NextResponse.json({ listing })
  } catch (error) {
    console.error('Get listing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromAuthHeader(request)
    const { id } = await params
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      address,
      price,
      description,
      status,
      listing_type,
      property_type,
      bedrooms,
      bathrooms,
      land_size,
      year_built,
      levies,
      rates,
      parking,
      features,
      mandate_expiry,
      instructions,
      virtual_tour_url,
      floorplan_url,
      open_house_dates,
      seller_name,
      seller_phone,
      seller_email,
      view_count,
      inquiry_count
    } = body

    // Verify listing belongs to user
    const { data: existing } = await getSupabaseClient(request)
      .from('crm_listings')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Build update object with only valid columns
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    const validColumns = ['address', 'price', 'description', 'status', 'notes',
      'listing_type', 'property_type', 'bedrooms', 'bathrooms', 'land_size',
      'year_built', 'levies', 'rates', 'parking', 'features', 'mandate_expiry',
      'instructions', 'virtual_tour_url', 'floorplan_url', 'open_house_dates',
      'view_count', 'inquiry_count']
    
    for (const key of validColumns) {
      if (key in body) updateData[key] = body[key]
    }

    const { data: listing, error } = await getSupabaseClient(request)
      .from('crm_listings')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating listing:', error)
      return NextResponse.json({ error: error.message || 'Failed to update listing' }, { status: 500 })
    }

    return NextResponse.json({ listing })
  } catch (error) {
    console.error('Update listing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromAuthHeader(request)
    const { id } = await params
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify listing belongs to user
    const { data: existing } = await getSupabaseClient(request)
      .from('crm_listings')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const { error } = await getSupabaseClient(request)
      .from('crm_listings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting listing:', error)
      return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete listing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
