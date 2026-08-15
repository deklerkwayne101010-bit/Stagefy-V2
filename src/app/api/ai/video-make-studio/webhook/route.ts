// Video Make Studio - Replicate Webhook
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const prediction = body as any

    if (!prediction?.id) {
      return NextResponse.json({ error: 'Missing prediction ID' }, { status: 400 })
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { data: clipProject } = await (adminClient.from as any)('projects')
      .select('*')
      .eq('input_data->>prediction_id', prediction.id)
      .eq('type', 'video')
      .neq('name', 'Video Make Studio Batch')
      .maybeSingle()

    if (!clipProject) {
      return NextResponse.json({ received: true })
    }

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
