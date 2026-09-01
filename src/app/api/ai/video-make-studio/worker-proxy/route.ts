import { NextRequest, NextResponse } from 'next/server'

const WORKER_URL = process.env.WORKER_URL
const WORKER_API_KEY = process.env.WORKER_API_KEY

export async function POST(request: NextRequest) {
  if (!WORKER_URL || !WORKER_API_KEY) {
    return NextResponse.json({ error: 'Worker not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()

    console.log('Worker proxy request:', {
      clipCount: body.clips?.length,
      hasFormat: !!body.format,
      hasUserId: !!body.userId,
      hasAppUrl: !!body.appUrl,
      hasMusic: !!body.musicUrl,
      hasCallingCard: !!body.callingCardUrl,
      hasEndFrame: !!body.endFrameUrl,
    })

    const workerResponse = await fetch(`${WORKER_URL}/stitch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': WORKER_API_KEY,
      },
      body: JSON.stringify(body),
    })

    const data = await workerResponse.json()

    if (!workerResponse.ok) {
      console.error('Worker error response:', { status: workerResponse.status, data })
      return NextResponse.json(data, { status: workerResponse.status })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Worker proxy error:', error)
    return NextResponse.json(
      { error: error.message || 'Worker request failed' },
      { status: 500 }
    )
  }
}
