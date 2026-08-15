// Video Make Studio - Batch Status & Processing
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { refundCredits } from '@/lib/credits'
import { createReplicatePrediction, pollReplicatePrediction, getAdminClient, getImageToVideoOperation } from '@/lib/video-make-studio/replicate'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface BatchClip {
  id: string
  imageIndex: number
  status: string
  outputUrl: string | null
  error: string | null
  creditsUsed: number
}

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const user = await getUserFromAuthHeader(request)
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = getAdminClient()
    const { batchId } = await params

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

    const clips: BatchClip[] = (clipProjects || []).map((project: any) => {
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

          await (adminClient.from as any)('ai_jobs')
            .insert({
              user_id: user.id,
              project_id: clipProject.id,
              service: 'replicate',
              model: input.tier === 'standard' ? 'prunaai/p-video' : 'xai/grok-imagine-video',
              input: { image_url: input.image_url, prompt: input.prompt, duration: input.duration, tier: input.tier },
              status: 'processing',
              credit_cost: clipProject.credit_cost,
            })

          const processingClip = clips.find(c => c.id === clipProject.id)
          if (processingClip) {
            processingClip.status = 'processing'
          }
        } catch (err: any) {
          await (adminClient.from as any)('projects')
            .update({
              status: 'failed',
              error_message: err.message,
            })
            .eq('id', clipProject.id)

          await refundCredits(user.id, getImageToVideoOperation(clipProject.input_data?.duration || 5), `clip-failed-${clipProject.id}`, clipProject.credit_cost)

          const failedClip = clips.find(c => c.id === clipProject.id)
          if (failedClip) {
            failedClip.status = 'failed'
            failedClip.error = err.message
          }
        }
      }
    } else if (processingClips.length > 0) {
      const nextClip = processingClips[0]
      const clipProject = (clipProjects || []).find((p: any) => p.id === nextClip.id)
      if (clipProject && clipProject.input_data?.prediction_id) {
        try {
          const prediction = await pollReplicatePrediction(clipProject.input_data.prediction_id, 20, 2000)

          if (prediction.output) {
            await (adminClient.from as any)('projects')
              .update({
                status: 'completed',
                output_data: { output_url: prediction.output },
                completed_at: new Date().toISOString(),
              })
              .eq('id', clipProject.id)

            await (adminClient.from as any)('ai_jobs')
              .insert({
                user_id: user.id,
                project_id: clipProject.id,
                service: 'replicate',
                model: clipProject.input_data?.tier === 'standard' ? 'prunaai/p-video' : 'xai/grok-imagine-video',
                input: clipProject.input_data,
                status: 'completed',
                output_url: prediction.output,
                credit_cost: clipProject.credit_cost,
              })

            const completedClip = clips.find(c => c.id === clipProject.id)
            if (completedClip) {
              completedClip.status = 'completed'
              completedClip.outputUrl = prediction.output
            }
          }
        } catch (err: any) {
          await (adminClient.from as any)('projects')
            .update({
              status: 'failed',
              error_message: err.message,
            })
            .eq('id', clipProject.id)

          await refundCredits(user.id, getImageToVideoOperation(clipProject.input_data?.duration || 5), `clip-failed-${clipProject.id}`, clipProject.credit_cost)

          const failedClip = clips.find(c => c.id === clipProject.id)
          if (failedClip) {
            failedClip.status = 'failed'
            failedClip.error = err.message
          }
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
