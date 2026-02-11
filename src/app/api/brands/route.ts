// API route for agency brands
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Demo brands for fallback
const DEMO_BRANDS = [
  {
    id: 'brand-remax',
    name: 'RE/MAX',
    slug: 'remax',
    logo_url: null,
    primary_color: '#e11d48',
    secondary_color: '#be123c',
    accent_color: '#f43f5e',
    heading_font: 'Montserrat',
    body_font: 'Open Sans',
    logo_position: 'top',
    tagline: 'With You All The Way',
    header_layout: 'extended',
    footer_layout: 'standard',
    badge_style: 'pill',
    template_styles: {},
    is_active: true,
    is_featured: true,
    display_order: 1,
  },
  {
    id: 'brand-pam-golding',
    name: 'Pam Golding Properties',
    slug: 'pam-golding',
    logo_url: null,
    primary_color: '#1e3a5f',
    secondary_color: '#0f172a',
    accent_color: '#3b82f6',
    heading_font: 'Playfair Display',
    body_font: 'Lato',
    logo_position: 'top',
    tagline: 'The Gold Standard in Property',
    header_layout: 'standard',
    footer_layout: 'standard',
    badge_style: 'square',
    template_styles: {},
    is_active: true,
    is_featured: true,
    display_order: 2,
  },
  {
    id: 'brand-seeff',
    name: 'Seeff',
    slug: 'seeff',
    logo_url: null,
    primary_color: '#0d9488',
    secondary_color: '#0f766e',
    accent_color: '#14b8a6',
    heading_font: 'Raleway',
    body_font: 'Inter',
    logo_position: 'sidebar',
    tagline: 'Experience the Difference',
    header_layout: 'compact',
    footer_layout: 'minimal',
    badge_style: 'rounded',
    template_styles: {},
    is_active: true,
    is_featured: true,
    display_order: 3,
  },
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const featured = searchParams.get('featured')
    const active = searchParams.get('active')
    const slug = searchParams.get('slug')

    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseAnonKey) {
      // Return demo brands if Supabase not configured
      if (slug) {
        const brand = DEMO_BRANDS.find(b => b.slug === slug)
        if (brand) {
          return NextResponse.json({ brand })
        }
        return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
      }
      return NextResponse.json({ brands: DEMO_BRANDS })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    let query = supabase
      .from('agency_brands')
      .select('*')
      .order('display_order', { ascending: true })

    // Filter by featured
    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    // Filter by active status
    if (active !== null) {
      query = query.eq('is_active', active === 'true')
    }

    // Get single brand by slug
    if (slug) {
      query = query.eq('slug', slug).limit(1)
    }

    const { data: brands, error } = await query

    if (error) {
      console.error('Error fetching brands:', error)
      // Return demo brands on error
      if (slug) {
        const brand = DEMO_BRANDS.find(b => b.slug === slug)
        if (brand) {
          return NextResponse.json({ brand })
        }
      }
      return NextResponse.json({ brands: DEMO_BRANDS })
    }

    // If no brands found, return demo brands
    if (!brands || brands.length === 0) {
      if (slug) {
        const brand = DEMO_BRANDS.find(b => b.slug === slug)
        if (brand) {
          return NextResponse.json({ brand })
        }
        return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
      }
      return NextResponse.json({ brands: DEMO_BRANDS })
    }

    if (slug) {
      return NextResponse.json({ brand: brands[0] })
    }

    return NextResponse.json({ brands })
  } catch (error) {
    console.error('Brands API error:', error)
    return NextResponse.json({ brands: DEMO_BRANDS })
  }
}

// Admin endpoint to create/update brands
export async function POST(request: Request) {
  try {
    // Check authentication (simplified - in production use proper auth)
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, logo_url, primary_color, secondary_color, accent_color, 
            heading_font, body_font, logo_position, tagline, header_layout, 
            footer_layout, badge_style, template_styles } = body

    // Validate required fields
    if (!name || !slug || !primary_color) {
      return NextResponse.json(
        { error: 'Name, slug, and primary color are required' },
        { status: 400 }
      )
    }

    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        error: 'Database not configured',
        demo: true,
        message: 'Cannot save brand without database configuration',
      }, { status: 503 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Check if brand already exists
    const { data: existing } = await supabase
      .from('agency_brands')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existing) {
      // Update existing brand
      const { data: brand, error } = await supabase
        .from('agency_brands')
        .update({
          name,
          logo_url,
          primary_color,
          secondary_color,
          accent_color,
          heading_font,
          body_font,
          logo_position,
          tagline,
          header_layout,
          footer_layout,
          badge_style,
          template_styles,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating brand:', error)
        return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 })
      }

      return NextResponse.json({ brand, updated: true })
    }

    // Create new brand
    const { data: brand, error } = await supabase
      .from('agency_brands')
      .insert({
        name,
        slug,
        logo_url,
        primary_color,
        secondary_color,
        accent_color,
        heading_font,
        body_font,
        logo_position,
        tagline,
        header_layout,
        footer_layout,
        badge_style,
        template_styles,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating brand:', error)
      return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 })
    }

    return NextResponse.json({ brand, created: true }, { status: 201 })
  } catch (error) {
    console.error('Create brand error:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating brand' },
      { status: 500 }
    )
  }
}
