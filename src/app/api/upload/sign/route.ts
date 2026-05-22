// Pre-signed Upload URL Route
// Generates a short-lived, single-use Supabase Storage upload URL so the
// browser can POST a large video file directly to Supabase — the file never
// flows through the Next.js serverless function, completely bypassing the
// Vercel ~4.5 MB body-size cap.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

export async function POST(request: NextRequest) {
  try {
    const { type, filename, contentType, size } = await request.json()

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'filename and contentType are required' },
        { status: 400 }
      )
    }

    // Authorise the caller
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseClient()
    const { data: { user }, error: authError } =
      await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const uploadType = type || 'video-editor'
    const ext = filename.split('.').pop()
    const objectPath = `${user.id}/${uploadType}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    // Ask Supabase for a time-limited, single-use signed upload URL
    const { data, error: uploadError } = await supabase.storage
      .from('videos')
      .createSignedUploadUrl(objectPath, {
        upsert: false,
      })

    if (uploadError || !data) {
      console.error('Failed to create signed URL:', uploadError)
      return NextResponse.json(
        { error: 'Failed to create upload URL' },
        { status: 500 }
      )
    }

    // Return everything the browser needs to upload directly to Supabase
    return NextResponse.json({
      uploadUrl: data.url,          // PUT target the browser calls
      path: data.path ?? objectPath, // path stored in Supabase (used for DB record)
      token: data.token,            // opaque token to identify / complete upload
    })
  } catch (error) {
    console.error('sign route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
