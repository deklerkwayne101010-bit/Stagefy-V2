// CRM Listings API - GET (list), POST (create)
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

// GET - List listings
export async function GET(request: Request) {
  try {
    const user = await getUserFromAuthHeader(request)
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const property_type = searchParams.get('property_type') || 'all'
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = getSupabaseClient(request)
      .from('crm_listings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filters
    if (search) {
      query = query.or(`address.ilike.%${search}%,title.ilike.%${search}%`)
    }
    
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (property_type && property_type !== 'all') {
      query = query.eq('property_type', property_type)
    }

    const { data: listings, error } = await query

    if (error) {
      console.error('Error fetching listings:', error)
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
    }

    return NextResponse.json({ listings: listings || [], total: listings?.length || 0 })
  } catch (error) {
    console.error('Listings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create listing
export async function POST(request: Request) {
  try {
    const user = await getUserFromAuthHeader(request)
    
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
      seller_email
    } = body

    // Validate required fields
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    // Build insert object with only valid base + migration columns
    const insertData: Record<string, any> = {
      user_id: user.id,
      address,
      price,
      status: status || 'active',
    }

    // Base schema column
    if (description) insertData.description = description
    if (body.notes) insertData.notes = body.notes

    // Migration 003 columns (only include if provided)
    if (listing_type) insertData.listing_type = listing_type
    if (property_type) insertData.property_type = property_type
    if (bedrooms) insertData.bedrooms = bedrooms
    if (bathrooms) insertData.bathrooms = bathrooms
    if (land_size) insertData.land_size = land_size
    if (year_built) insertData.year_built = year_built
    if (levies) insertData.levies = levies
    if (rates) insertData.rates = rates
    if (parking) insertData.parking = parking
    if (features) insertData.features = features
    if (mandate_expiry) insertData.mandate_expiry = mandate_expiry
    if (instructions) insertData.instructions = instructions
    if (virtual_tour_url) insertData.virtual_tour_url = virtual_tour_url
    if (floorplan_url) insertData.floorplan_url = floorplan_url
    if (open_house_dates) insertData.open_house_dates = open_house_dates

    const { data: listing, error } = await getSupabaseClient(request)
      .from('crm_listings')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating listing:', error)
      return NextResponse.json({ error: error.message || 'Failed to create listing' }, { status: 500 })
    }

    return NextResponse.json({ listing }, { status: 201 })
  } catch (error) {
    console.error('Create listing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
