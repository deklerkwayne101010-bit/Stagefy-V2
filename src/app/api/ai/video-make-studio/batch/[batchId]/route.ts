// Video Make Studio - Batch Status & Processing
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { refundCredits } from '@/lib/credits'

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

async function pollReplicatePrediction(predictionId: string, maxAttempts = 10, intervalMs = 2000): Promise<any> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to poll Replicate prediction: ${errorText}`)
    }

    const prediction = await response.json()
    const status = prediction.status

    if (status === 'succeeded') {
      return prediction
    }

    if (status === 'failed' || status === 'canceled') {
      throw new Error(`Replicate generation ${status}: ${prediction.error || 'Unknown error'}`)
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }

  throw new Error('Replicate generation timed out')
}

async function createReplicatePrediction(imageUrl: string, prompt: string, duration: number, tier: string): Promise<{ predictionId: string; output?: string }> {
  let prediction
  if (tier === 'standard') {
    const response = await fetch('https://api.replicate.com/v1/models/prunaai/p-video/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          fps: 24,
          draft: false,
          image: imageUrl,
          no_op: false,
          prompt: prompt || 'smooth camera movement, gentle pan',
          duration: duration,
          resolution: '720p',
          save_audio: true,
          aspect_ratio: '16:9',
          prompt_upsampling: false,
          disable_safety_filter: true,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create prediction: ${errorText}`)
    }

    prediction = await response.json()
  } else {
    const response = await fetch('https://api.replicate.com/v1/models/xai/grok-imagine-video/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          prompt: prompt || 'smooth camera movement, gentle pan',
          image: imageUrl,
          duration: duration,
          resolution: '720p',
          mode: 'normal',
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create prediction: ${errorText}`)
    }

    prediction = await response.json()
  }

  return { predictionId: prediction.id }
}

export async function GET(
  request: Request,
  { params }: { params: { batchId: string } }
) {
  try {
    const user = await getUserFromAuthHeader(request)
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)
    const batchId = params.batchId

    const { data: batchProject } = await (adminClient.from as any)('projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'video')
      .eq('input_data->>batch_id', batchId)
      .eq('name', 'Video Make Studio Batch')
      .single()

    if (!batchProject) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    const { data: clipProjects } = await (adminClient.from as any)('projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'video')
      .eq('input_data->>batch_id', batchId)
      .neq('name', 'Video Make Studio Batch')
      .order('created_at', { ascending: true })

    const clips = (clipProjects || []).map((project: any) => {
      const input = project.input_data || {}
      return {
        id: project.id,
        imageIndex: input.image_index ?? 0,
        status: project.status,
        outputUrl: project.output_data?.output_url || null,
        error: project.error_message || null,
        creditsUsed: project.credit_cost || 0,
      }
    })

    const pendingClips = clips.filter(c => c.status === 'pending')
    const processingClips = clips.filter(c => c.status === 'processing')
    const completedClips = clips.filter(c => c.status === 'completed')
    const failedClips = clips.filter(c => c.status === 'failed')

    if (pendingClips.length > 0 && processingClips.length === 0) {
      const nextClip = pendingClips[0]
      const clipProject = (clipProjects || []).find((p: any) => p.id === nextClip.id)
      if (clipProject) {
        try {
          const input = clipProject.input_data || {}
          const { predictionId } = await createReplicatePrediction(
            input.image_url,
            input.prompt,
            input.duration,
            input.tier
          )

          await (adminClient.from as any)('projects')
            .update({
              status: 'processing',
              input_data: { ...clipProject.input_data, prediction_id: predictionId },
            })
            .eq('id', clipProject.id)

          clips.find(c => c.id === clipProject.id).status = 'processing'
        } catch (err: any) {
          await (adminClient.from as any)('projects')
            .update({
              status: 'failed',
              error_message: err.message,
            })
            .eq('id', clipProject.id)

          await refundCredits(user.id, `image_to_video_${clipProject.input_data?.duration || 5}sec`, `clip-failed-${clipProject.id}`, clipProject.credit_cost)

          clips.find(c => c.id === clipProject.id).status = 'failed'
          clips.find(c => c.id === clipProject.id).error = err.message
        }
      }
    } else if (processingClips.length > 0) {
      const nextClip = processingClips[0]
      const clipProject = (clipProjects || []).find((p: any) => p.id === nextClip.id)
      if (clipProject && clipProject.input_data?.prediction_id) {
        try {
          const prediction = await pollReplicatePrediction(clipProject.input_data.prediction_id, 10, 2000)

          if (prediction.output) {
            await (adminClient.from as any)('projects')
              .update({
                status: 'completed',
                output_data: { output_url: prediction.output },
                completed_at: new Date().toISOString(),
              })
              .eq('id', clipProject.id)

            clips.find(c => c.id === clipProject.id).status = 'completed'
            clips.find(c => c.id === clipProject.id).outputUrl = prediction.output
          }
        } catch (err: any) {
          await (adminClient.from as any)('projects')
            .update({
              status: 'failed',
              error_message: err.message,
            })
            .eq('id', clipProject.id)

          await refundCredits(user.id, `image_to_video_${clipProject.input_data?.duration || 5}sec`, `clip-failed-${clipProject.id}`, clipProject.credit_cost)

          clips.find(c => c.id === clipProject.id).status = 'failed'
          clips.find(c => c.id === clipProject.id).error = err.message
        }
      }
    }

    const allDone = clips.every(c => c.status === 'completed' || c.status === 'failed')
    const hasFailed = failedClips.length > 0

    return NextResponse.json({
      batchId,
      status: allDone ? (hasFailed ? 'completed_with_errors' : 'completed') : 'processing',
      settings: batchProject.input_data?.settings || {},
      clips,
      summary: {
        total: clips.length,
        completed: clips.filter(c => c.status === 'completed').length,
        failed: clips.filter(c => c.status === 'failed').length,
        pending: clips.filter(c => c.status === 'pending').length,
        processing: clips.filter(c => c.status === 'processing').length,
      },
    })
  } catch (error) {
    console.error('Video Make Studio batch status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
