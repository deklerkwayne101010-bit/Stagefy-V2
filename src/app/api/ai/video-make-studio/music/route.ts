// Video Maker Studio - List available music tracks from Supabase storage
import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'

const MUSIC_BUCKET = 'music'

export async function GET() {
  try {
    const adminClient = getAdminClient()
    if (!adminClient) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })
    }

    const { data: files, error } = await adminClient.storage
      .from(MUSIC_BUCKET)
      .list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' },
      })

    if (error || !files || files.length === 0) {
      return NextResponse.json({ tracks: [] })
    }

    const tracks = files
      .filter(file => file.name.endsWith('.mp3') || file.name.endsWith('.wav') || file.name.endsWith('.m4a'))
      .map(file => {
        const proxyUrl = `/api/ai/video-make-studio/music/${encodeURIComponent(file.name)}`

        return {
          id: file.name.replace(/\.[^/.]+$/, ''),
          name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          url: proxyUrl,
          durationSeconds: 0,
        }
      })

    return NextResponse.json({ tracks })
  } catch (error) {
    console.error('Error listing music tracks:', error)
    return NextResponse.json({ tracks: [] })
  }
}
