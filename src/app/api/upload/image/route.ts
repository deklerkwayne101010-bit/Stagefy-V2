// Image Upload API Route
// Handles image uploads to Supabase Storage

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'

// Import actual Supabase client for storage
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Create service role client for bucket operations (bypasses RLS)
const getServiceClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

// Create actual supabase client for storage operations
const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) return null
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Check if running in demo mode
const isDemoMode = !supabaseUrl || !supabaseAnonKey

// Ensure bucket exists, create if not (using service role)
async function ensureBucketExists(supabase: any, bucketName: string) {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucket = buckets?.find((b: any) => b.id === bucketName)
    
    if (!bucket) {
      // Create the bucket
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: '5MB',
      })
      
      if (error) {
        console.error('Error creating bucket:', error)
        return false
      }
      console.log('Created bucket:', bucketName)
    }
    return true
  } catch (err) {
    console.error('Bucket check error:', err)
    return false
  }
}

export async function POST(request: Request) {
  try {
    let userId: string | null = null

    // Check if Supabase is configured
    const isSupabaseConfigured = !isDemoMode

    if (isSupabaseConfigured) {
      try {
        const user = await getCurrentUser()
        userId = user?.id || null
      } catch (authError) {
        console.error('Auth error:', authError)
        // Continue without user - allow public uploads if policies permit
      }
    }

    const formData = await request.formData()
    const image = formData.get('image') as File | null
    const type = formData.get('type') as string || 'general'

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    // Demo mode: return base64 data URL (no Supabase configured)
    if (isDemoMode) {
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
    const maxSize = 5 * 1024 * 1024
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
    const fileName = `${folder}/${userId || 'public'}-${timestamp}-${randomId}.${extension}`

    // Convert file to buffer
    const arrayBuffer = await image.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Try with service role first (bypasses RLS)
    const supabaseService = getServiceClient()
    if (supabaseService) {
      // Ensure bucket exists with service role
      await ensureBucketExists(supabaseService, 'uploads')
      
      const { data, error } = await supabaseService.storage
        .from('uploads')
        .upload(fileName, buffer, {
          contentType: image.type,
          upsert: true,
        })

      if (!error) {
        const { data: urlData } = await supabaseService.storage
          .from('uploads')
          .getPublicUrl(fileName)

        return NextResponse.json({
          url: urlData.publicUrl,
          path: data?.path,
          success: true,
        })
      }
      
      console.error('Service role upload failed:', error)
      // Fall through to try anon client
    }

    // Try with anon client (requires proper RLS policies)
    const supabaseClient = getSupabaseClient()
    if (supabaseClient) {
      const { data, error } = await supabaseClient.storage
        .from('uploads')
        .upload(fileName, buffer, {
          contentType: image.type,
          upsert: true,
        })

      if (!error) {
        const { data: urlData } = await supabaseClient.storage
          .from('uploads')
          .getPublicUrl(fileName)

        return NextResponse.json({
          url: urlData.publicUrl,
          path: data?.path,
          success: true,
        })
      }
      
      console.error('Anon upload failed:', error)
      
      // If upload fails due to RLS/403, fall back to base64
      const bytes = await image.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      const mimeType = image.type || 'image/jpeg'
      const dataUrl = `data:${mimeType};base64,${base64}`
      
      return NextResponse.json({
        url: dataUrl,
        fallback: true,
        message: 'Storage upload failed - using base64 fallback',
      })
    }

    // Last resort: base64
    const fallbackBytes = await image.arrayBuffer()
    const fallbackBase64 = Buffer.from(fallbackBytes).toString('base64')
    const fallbackMimeType = image.type || 'image/jpeg'
    const fallbackDataUrl = `data:${fallbackMimeType};base64,${fallbackBase64}`
    
    return NextResponse.json({
      url: fallbackDataUrl,
      fallback: true,
      message: 'Using base64 fallback',
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
