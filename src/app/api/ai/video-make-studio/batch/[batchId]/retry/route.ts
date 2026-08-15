// Video Make Studio - Retry Failed Clip
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { canPerformAction, reserveCredits } from '@/lib/credits'
import { createReplicatePrediction, getAdminClient } from '@/lib/video-make-studio/replicate'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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

export async function POST(
  request: Request,
  { params }: { params: { batchId: string } }
) {
  try {
    const user = await getUserFromAuthHeader(request)
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as { clipId: string }
    const { clipId } = body
    const batchId = params.batchId

    if (!clipId) {
      return NextResponse.json({ error: 'clipId is required' }, { status: 400 })
    }

    const adminClient = getAdminClient()

    const { data: clipProject } = await (adminClient.from as any)('projects')
      .select('*')
      .eq('id', clipId)
      .eq('user_id', user.id)
      .eq('type', 'video')
      .single()

    if (!clipProject) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 })
    }

    const input = clipProject.input_data || {}
    if (!input.batch_id || input.batch_id !== batchId) {
      return NextResponse.json({ error: 'Clip does not belong to this batch' }, { status: 400 })
    }

    if (clipProject.status !== 'failed') {
      return NextResponse.json({ error: 'Only failed clips can be retried' }, { status: 400 })
    }

    const clipCost = calculateClipCredits(input.duration || 5, input.tier || 'pro')
    const creditReference = `video-studio-retry-${clipId}`

    const canPerform = await canPerformAction(user.id, clipCost)
    if (!canPerform.canPerform) {
      return NextResponse.json(
        { error: canPerform.error || 'Insufficient credits for retry' },
        { status: 402 }
      )
    }

    const reservation = await reserveCredits(user.id, 'video_full_edit', creditReference, clipCost)
    if (!reservation.success) {
      return NextResponse.json(
        { error: reservation.error || 'Failed to reserve credits for retry' },
        { status: 402 }
      )
    }

    await (adminClient.from as any)('projects')
      .update({
        status: 'pending',
        error_message: null,
        output_data: {},
        input_data: { ...clipProject.input_data, prediction_id: null },
      })
      .eq('id', clipId)

    return NextResponse.json({ success: true, clipId, creditsReserved: clipCost })
  } catch (error) {
    console.error('Video Make Studio retry error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
