// Video Make Studio - Start Batch
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkUserCredits, reserveCredits, refundCredits, canPerformAction } from '@/lib/credits'
import { createNotification } from '@/lib/notifications'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN!

async function getUserFromAuthHeader(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.replace('Bearer ', '')
  const client = createClient(supabaseUrl, supabaseAnonKey)
  try {
    const { data: { user }, error } = await client.auth.getUser(token)
    if (error || !user) return null
    return user
  } catch {
    return null
  }
}

function calculateClipCredits(duration: number, tier: 'standard' | 'pro'): number {
  return tier === 'standard' ? duration : Math.ceil(duration * (5 / 3))
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      images: string[]
      prompt: string
      duration: string
      tier: 'standard' | 'pro'
      formatKey: string
      formatWidth: number
      formatHeight: number
    }

    const { images, prompt, duration, tier, formatKey, formatWidth, formatHeight } = body

    if (!images || images.length < 3 || images.length > 30) {
      return NextResponse.json(
        { error: 'You must upload between 3 and 30 images.' },
        { status: 400 }
      )
    }

    const user = await getUserFromAuthHeader(request)
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const durationNumber = parseInt(duration, 10)
    const totalClipCost = images.reduce(
      (sum, _, index) => sum + calculateClipCredits(durationNumber, tier),
      0
    )

    const canPerform = await canPerformAction(user.id, totalClipCost)
    if (!canPerform.canPerform) {
      return NextResponse.json(
        { error: canPerform.error || 'Insufficient credits' },
        { status: 402 }
      )
    }

    const batchId = `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const creditReference = `video-studio-batch-${batchId}`

    const reservation = await reserveCredits(user.id, 'video_full_edit', creditReference, totalClipCost)
    if (!reservation.success) {
      return NextResponse.json(
        { error: reservation.error || 'Failed to reserve credits' },
        { status: 402 }
      )
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { data: batchProject, error: batchError } = await (adminClient.from as any)('projects')
      .insert({
        user_id: user.id,
        name: 'Video Make Studio Batch',
        type: 'video',
        status: 'processing',
        credit_cost: totalClipCost,
        input_data: {
          batch_id: batchId,
          total_clips: images.length,
          settings: { prompt, duration: durationNumber, tier, formatKey, formatWidth, formatHeight },
        },
      })
      .select('id')
      .single()

    if (batchError || !batchProject) {
      await refundCredits(user.id, 'video_full_edit', creditReference, totalClipCost)
      return NextResponse.json(
        { error: 'Failed to create batch project' },
        { status: 500 }
      )
    }

    const clipProjects = []
    for (let i = 0; i < images.length; i++) {
      const { data: clip, error: clipError } = await (adminClient.from as any)('projects')
        .insert({
          user_id: user.id,
          name: `Clip ${i + 1}`,
          type: 'video',
          status: 'pending',
          credit_cost: calculateClipCredits(durationNumber, tier),
          input_data: {
            batch_id: batchId,
            image_index: i,
            image_url: images[i],
            prompt,
            duration: durationNumber,
            tier,
          },
        })
        .select('id')
        .single()

      if (clipError || !clip) {
        console.error('Failed to create clip project:', clipError)
        continue
      }
      clipProjects.push(clip)
    }

    await createNotification({
      userId: user.id,
      type: 'job_completed',
      title: 'Video Make Studio Batch Started',
      message: `Processing ${images.length} clips for your batch video.`,
      data: { batchId },
    })

    return NextResponse.json({
      batchId,
      totalClips: images.length,
      clipsCreated: clipProjects.length,
      totalCreditsReserved: totalClipCost,
    })
  } catch (error) {
    console.error('Video Make Studio batch start error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
