// Image Upload API Route
// Handles image uploads to Supabase Storage

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

// Check if running in demo mode
const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function POST(request: Request) {
  try {
    let userId: string | null = null

    // Check if Supabase is configured
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (isSupabaseConfigured) {
      try {
        const user = await getCurrentUser()
        userId = user?.id || null
      } catch (authError) {
        console.error('Auth error:', authError)
      }
    }

    const formData = await request.formData()
    const image = formData.get('image') as File | null
    const type = formData.get('type') as string || 'general' // 'photo' or 'logo' or 'general'

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    // Demo mode: return mock URL
    if (!userId || isDemoMode) {
      // For demo mode, convert to base64 data URL
      const bytes = await image.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      const mimeType = image.type || 'image/jpeg'
      const dataUrl = `data:${mimeType};base64,${base64}`
      
      return NextResponse.json({
        url: dataUrl,
        demo: true,
        demoMessage: 'Demo mode: Image stored as data URL',
      })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (image.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const extension = image.name.split('.').pop() || 'jpg'
    const folder = type === 'photo' ? 'agent-photos' : type === 'logo' ? 'agent-logos' : 'general'
    const filename = `${folder}/${userId}-${timestamp}-${randomId}.${extension}`

    // Convert file to buffer
    const arrayBuffer = await image.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filename, buffer, {
        contentType: image.type,
        upsert: true,
      })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json(
        { error: 'Failed to upload image: ' + error.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(filename)

    return NextResponse.json({
      url: urlData.publicUrl,
      path: data.path,
      success: true,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
