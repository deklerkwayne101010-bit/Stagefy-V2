// Video Make Studio - Replicate Webhook
import { NextResponse } from 'next/server'
import { refundCredits } from '@/lib/credits'
import { getAdminClient } from '@/lib/video-make-studio/replicate'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const prediction = body as any

    if (!prediction?.id) {
      return NextResponse.json({ error: 'Missing prediction ID' }, { status: 400 })
    }

    const adminClient = getAdminClient()

    const { data: clipProject } = await (adminClient.from as any)('projects')
      .select('*')
      .eq('input_data->>prediction_id', prediction.id)
      .eq('type', 'video')
      .neq('name', 'Video Make Studio Batch')
      .maybeSingle()

    if (!clipProject) {
      return NextResponse.json({ received: true })
    }

    const input = clipProject.input_data || {}

    if (prediction.status === 'succeeded' && prediction.output) {
      await (adminClient.from as any)('projects')
        .update({
          status: 'completed',
          output_data: { output_url: prediction.output },
          completed_at: new Date().toISOString(),
        })
        .eq('id', clipProject.id)
    } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
      await (adminClient.from as any)('projects')
        .update({
          status: 'failed',
          error_message: prediction.error || 'Replicate generation failed',
        })
        .eq('id', clipProject.id)

      try {
        await refundCredits(clipProject.user_id, `image_to_video_${input.duration || 5}sec`, `webhook-failed-${clipProject.id}`, clipProject.credit_cost)
      } catch (refundError) {
        console.error('Failed to refund credits for failed webhook clip:', refundError)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Video Make Studio webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
