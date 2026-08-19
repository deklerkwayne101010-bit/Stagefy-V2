import { createClient } from '@supabase/supabase-js'
import { type CreditOperation } from '@/lib/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN!

export function getImageToVideoOperation(duration: number): CreditOperation {
  switch (duration) {
    case 3:
      return 'image_to_video_3sec'
    case 5:
      return 'image_to_video_5sec'
    case 10:
      return 'image_to_video_10sec'
    case 15:
      return 'image_to_video_15sec'
    default:
      return 'image_to_video_5sec'
  }
}

export async function createReplicatePrediction(imageUrl: string, prompt: string, duration: number, tier: string): Promise<{ predictionId: string }> {
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

export async function pollReplicatePrediction(predictionId: string, maxAttempts = 20, intervalMs = 2000): Promise<any> {
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

export async function checkReplicatePrediction(predictionId: string): Promise<any> {
  const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to check Replicate prediction: ${errorText}`)
  }

  return await response.json()
}

export function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey)
}
