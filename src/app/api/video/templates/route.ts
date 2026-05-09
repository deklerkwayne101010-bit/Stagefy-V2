import { NextRequest, NextResponse } from 'next/server'
import type { VideoTemplate } from '@/lib/types'
import { randomUUID } from 'crypto'

const VIDEO_TEMPLATES: VideoTemplate[] = [
  {
    id: 'property_showcase',
    name: 'Property Showcase',
    category: 'real_estate',
    description: 'Quick property video with smooth transitions',
    duration: 30,
    transitions: [{ id: 't1', type: 'fade', duration: 1, position: 5 }],
    textOverlays: [
      { id: 'txt1', text: 'Property Tour', style: 'elegant', position: { x: 50, y: 10 }, startTime: 0, duration: 5, fontSize: 48 },
      { id: 'txt2', text: 'For Sale', style: 'elegant', position: { x: 50, y: 90 }, startTime: 25, duration: 5, fontSize: 36 }
    ],
    aspectRatio: '16:9',
  },
  {
    id: 'social_reel',
    name: 'Social Reel',
    category: 'social',
    description: '9:16 vertical video for Instagram/TikTok',
    duration: 15,
    transitions: [],
    textOverlays: [],
    aspectRatio: '9:16',
  },
  {
    id: 'testimonial',
    name: 'Testimonial Montage',
    category: 'marketing',
    description: 'Client review compilation',
    duration: 20,
    transitions: [{ id: 't1', type: 'slide', duration: 1, position: 10 }],
    textOverlays: [],
    aspectRatio: '16:9',
  },
  {
    id: 'listing_tour',
    name: 'Listing Tour',
    category: 'real_estate',
    description: 'Full property walkthrough with background music',
    duration: 60,
    transitions: [{ id: 't1', type: 'fade', duration: 1, position: 15 }],
    textOverlays: [
      { id: 'txt1', text: 'Virtual Tour', style: 'modern', position: { x: 50, y: 10 }, startTime: 0, duration: 5, fontSize: 48 }
    ],
    aspectRatio: '16:9',
    musicTrack: 'upbeat_corporate',
  },
  {
    id: 'open_house',
    name: 'Open House Promo',
    category: 'marketing',
    description: 'Event promotion video with event details',
    duration: 30,
    transitions: [{ id: 't1', type: 'zoom', duration: 1, position: 10 }],
    textOverlays: [
      { id: 'txt1', text: 'OPEN HOUSE', style: 'bold', position: { x: 50, y: 20 }, startTime: 0, duration: 10, fontSize: 64 },
      { id: 'txt2', text: 'Saturday 2-4 PM', style: 'elegant', position: { x: 50, y: 50 }, startTime: 5, duration: 20, fontSize: 36 }
    ],
    aspectRatio: '16:9',
  },
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')

    let templates = VIDEO_TEMPLATES

    if (category) {
      templates = templates.filter(t => t.category === category)
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, category, transitions, textOverlays, aspectRatio } = await request.json()

    // Get user session from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const newTemplate: VideoTemplate = {
      id: randomUUID(),
      name,
      category,
      description: '',
      duration: 30,
      transitions: transitions || [],
      textOverlays: textOverlays || [],
      aspectRatio: aspectRatio || '16:9',
    }

    // In a real app, save to database
    // For now, just return the template
    return NextResponse.json({ template: newTemplate })
  } catch (error) {
    console.error('Error saving template:', error)
    return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
  }
}