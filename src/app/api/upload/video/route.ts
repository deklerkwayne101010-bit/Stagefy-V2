import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const video = formData.get('video') as File
    const type = formData.get('type') as string || 'property'

    if (!video) {
      return NextResponse.json({ error: 'No video provided' }, { status: 400 })
    }

    // Validate file size (max 50MB for browser processing)
    const maxSize = 50 * 1024 * 1024
    if (video.size > maxSize) {
      return NextResponse.json({ error: 'Video too large. Maximum 50MB.' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo']
    if (!allowedTypes.includes(video.type)) {
      return NextResponse.json({ error: 'Invalid video format. Supported: MP4, MOV, WebM, AVI' }, { status: 400 })
    }

    // Get user session from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create unique filename
    const fileExtension = video.name.split('.').pop()
    const fileName = `${user.id}/${type}/${uuidv4()}.${fileExtension}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(fileName, video, {
        contentType: video.type,
        cacheControl: '3600',
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(fileName)

    return NextResponse.json({
      url: urlData.publicUrl,
      path: fileName,
      size: video.size,
    })
  } catch (error) {
    console.error('Video upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}