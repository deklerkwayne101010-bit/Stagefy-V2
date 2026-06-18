// API route for Image to Video (Replicate)
import {
  NextResponse
} from 'next/server'
import {
  checkUserCredits,
  reserveCredits,
  refundCredits,
  CREDIT_COSTS,
  canPerformAction
} from '@/lib/credits'
import { createNotification } from '@/lib/notifications'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN!

async function getUserFromAuthHeader(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

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

async function createReplicateSignedUploadUrl(userId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  const filePath = `replicate-videos/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`
  const { data, error } = await supabase.storage
    .from('uploads')
    .createSignedUploadUrl(filePath, { upsert: false })

  if (error || !data) {
    throw new Error(`Failed to create Replicate upload URL: ${error?.message || 'unknown error'}`)
  }

  return {
    signedUrl: data.signedUrl,
    path: data.path as string,
    token: data.token,
  }
}

function buildSupabasePublicUrl(path: string) {
  const { hostname, protocol } = new URL(supabaseUrl)
  const encoded = encodeURIComponent(path)
  return `${protocol}//${hostname}/storage/v1/object/public/uploads/${encoded}`
}

const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function POST(request: Request) {
  try {
    const { images, mode, duration, prompt } = await request.json() as {
      images: string[]
      mode: 'single' | 'frames'
      duration: string
      prompt?: string
    }

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: images' },
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

    const userIdStr = user.id
    const durationNumber = parseInt(duration, 10)
    const creditCost = Math.ceil(durationNumber * (5 / 3))

    if (isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      return NextResponse.json({
        outputUrl: null,
        jobId: 'demo-job-' + Date.now(),
        creditsUsed: 0,
        remainingCredits: 50,
        demo: true,
        demoMessage: 'Demo mode: Image to video requires Supabase and Replicate API configuration. Set environment variables to enable.',
      })
    }

    const canPerform = await canPerformAction(userIdStr, creditCost)
    if (!canPerform.canPerform) {
      return NextResponse.json(
        { error: canPerform.error || 'Cannot perform action' },
        { status: 402 }
      )
    }

    const reservation = await reserveCredits(userIdStr, `image_to_video_${duration}sec` as any, `video-${Date.now()}`)
    if (!reservation.success) {
      return NextResponse.json(
        { error: reservation.error || 'Failed to reserve credits' },
        { status: 402 }
      )
    }

    try {
      if (!REPLICATE_API_TOKEN) {
        throw new Error('REPLICATE_API_TOKEN not configured')
      }

      let imageUrl = images[0]

      if (images[0].startsWith('data:')) {
        const imageResponse = await fetch('https://api.replicate.com/v1/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content_type: 'image/jpeg',
          }),
        })

        if (!imageResponse.ok) {
          throw new Error('Failed to create upload URL')
        }

        const uploadData = (await imageResponse.json()) as {
          urls: { upload_url: string; url: string }[]
        }

        const base64Data = images[0].split(',')[1]
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }

        const uploadResponse = await fetch(uploadData.urls[0].upload_url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'image/jpeg',
          },
          body: bytes,
        })

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image')
        }

        imageUrl = uploadData.urls[0].url
      }

      const signed = await createReplicateSignedUploadUrl(userIdStr)
      const replicateOutputConfig = {
        format: 'mp4',
        upload_url: signed.signedUrl,
      } as const

      let prediction
      if (mode === 'frames') {
        const startImage = images[0]
        const endImage = images.length > 1 ? images[1] : images[0]

        const response = await fetch('https://api.replicate.com/v1/models/kwaivgi/kling-v3-omni-video/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
            'Prefer': 'wait',
          },
          body: JSON.stringify({
            input: {
              mode: 'pro',
              prompt: prompt || 'Smooth video transition between frames',
              duration: parseInt(duration, 10),
              aspect_ratio: '16:9',
              generate_audio: true,
              keep_original_sound: true,
              video_reference_type: 'feature',
              start_image: startImage,
              end_image: endImage,
            },
            output: replicateOutputConfig,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to create video with kling-v3-omni-video: ${errorText}`)
        }

        prediction = await response.json()
      } else {
        const response = await fetch('https://api.replicate.com/v1/models/xai/grok-imagine-video/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
            'Prefer': 'wait',
          },
          body: JSON.stringify({
            input: {
              prompt: prompt || 'smooth camera movement, gentle pan',
              image: imageUrl,
              duration: parseInt(duration, 10),
              resolution: '720p',
              mode: 'normal',
            },
            output: replicateOutputConfig,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to create video with grok-imagine-video: ${errorText}`)
        }

        prediction = await response.json()
      }

      const output = prediction.output as string | undefined
      if (!output && typeof (prediction as any).outputPath === 'string') {
        return NextResponse.json({
          outputUrl: buildSupabasePublicUrl((prediction as any).outputPath),
          jobId: prediction.id,
          creditsUsed: creditCost,
          remainingCredits: await checkUserCredits(userIdStr),
          isWatermarked: false,
        })
      }

      if (!output) {
        throw new Error('Replicate did not return a video output.')
      }

      const modeLabel = mode === 'frames' ? 'Image Sequence' : 'Single Image'
      await createNotification({
        userId: userIdStr,
        type: 'job_completed',
        title: 'Video Creation Complete',
        message: `Your ${duration} second ${modeLabel} video is ready!`,
        data: { jobId: prediction.id, mode, duration },
      })

      return NextResponse.json({
        outputUrl: output,
        jobId: prediction.id,
        creditsUsed: creditCost,
        remainingCredits: await checkUserCredits(userIdStr),
        isWatermarked: false,
      })
    } catch (aiError) {
      await refundCredits(userIdStr, `image_to_video_${duration}sec` as any, `video-${Date.now()}`)

      console.error('Image to video failure:', aiError)

      return NextResponse.json({
        outputUrl: null,
        jobId: 'demo-job-' + Date.now(),
        creditsUsed: 0,
        remainingCredits: await checkUserCredits(userIdStr),
        isWatermarked: false,
        demo: true,
      })
    }
  } catch (error) {
    console.error('Image to video error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
