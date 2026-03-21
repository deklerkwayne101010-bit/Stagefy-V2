// CRM Listing API - GET, PUT, DELETE single listing
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: listing, error } = await supabase
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
    const user = await getCurrentUser()
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
    const { data: existing } = await supabase
      .from('crm_listings')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const { data: listing, error } = await supabase
      .from('crm_listings')
      .update({
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
        inquiry_count,
        updated_at: new Date().toISOString()
      })
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
    const user = await getCurrentUser()
    const { id } = await params
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify listing belongs to user
    const { data: existing } = await supabase
      .from('crm_listings')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const { error } = await supabase
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
