// Video Maker Studio - Proxy music track playback to avoid CORS issues
import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'

const MUSIC_BUCKET = 'music'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    const adminClient = getAdminClient()
    if (!adminClient) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })
    }

    const { data: fileData, error: downloadError } = await adminClient.storage
      .from(MUSIC_BUCKET)
      .download(filename)

    if (downloadError || !fileData) {
      console.error('Music download error:', downloadError)
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    const ext = filename.split('.').pop()?.toLowerCase()
    const contentType = ext === 'mp3' ? 'audio/mpeg' : ext === 'wav' ? 'audio/wav' : ext === 'm4a' ? 'audio/mp4' : 'audio/mpeg'

    const bytes = await fileData.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uint8 = new Uint8Array(buffer)

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Accept-Ranges': 'bytes',
        'Content-Length': String(uint8.length),
      },
    })
  } catch (error) {
    console.error('Error streaming music track:', error)
    return NextResponse.json({ error: 'Failed to load track' }, { status: 500 })
  }
}
