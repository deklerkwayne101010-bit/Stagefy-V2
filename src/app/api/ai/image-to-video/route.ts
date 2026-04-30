// API route for Image to Video (Replicate)
import { NextResponse } from 'next/server'
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

// Helper to get user from Authorization header
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

// Check if running in demo mode (no Supabase configured)
const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function POST(request: Request) {
  try {
    const { images, mode, duration, prompt } = await request.json()

    // Validate input
    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: images' },
        { status: 400 }
      )
    }

    // Get user from Authorization header only
    const user = await getUserFromAuthHeader(request)
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userIdStr = user.id
    const creditCost = CREDIT_COSTS[`image_to_video_${duration}sec` as keyof typeof CREDIT_COSTS] || 8

    // Demo mode: skip credit check and return demo response
    if (isDemoMode) {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Return mock response for demo
      return NextResponse.json({
        outputUrl: null,
        jobId: 'demo-job-' + Date.now(),
        creditsUsed: 0,
        remainingCredits: 50,
        demo: true,
        demoMessage: 'Demo mode: Image to video requires Supabase and Replicate API configuration. Set environment variables to enable.',
      })
    }

    // Check if user can perform this action (based on credits)
    const canPerform = await canPerformAction(userIdStr, creditCost)
    
    if (!canPerform.canPerform) {
      return NextResponse.json(
        { error: canPerform.error || 'Cannot perform action' },
        { status: 402 }
      )
    }

    // Reserve credits for the operation
    const reservation = await reserveCredits(userIdStr, `image_to_video_${duration}sec` as any, `video-${Date.now()}`)
    if (!reservation.success) {
      return NextResponse.json(
        { error: reservation.error || 'Failed to reserve credits' },
        { status: 402 }
      )
    }

    try {
      // Check if Replicate API token exists
      if (!process.env.REPLICATE_API_TOKEN) {
        throw new Error('REPLICATE_API_TOKEN not configured')
      }

      // Upload first image to Replicate storage if it's a data URL
      let imageUrl = images[0]
      
      if (images[0].startsWith('data:')) {
        // Upload to Replicate as a temporary URL
        const imageResponse = await fetch('https://api.replicate.com/v1/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content_type: 'image/jpeg',
          }),
        })
        
        if (!imageResponse.ok) {
          throw new Error('Failed to create upload URL')
        }
        
        const uploadData = await imageResponse.json()
        
        // Convert base64 to blob and upload
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
      
      let prediction;
      
      if (mode === 'frames') {
        // Use kling-v3-omni-video for image sequence (start + end frame)
        // Need start_image and end_image for the sequence
        const startImage = images[0]
        const endImage = images.length > 1 ? images[1] : images[0]
        
        const response = await fetch('https://api.replicate.com/v1/models/kwaivgi/kling-v3-omni-video/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
            'Prefer': 'wait',
          },
          body: JSON.stringify({
            input: {
              mode: 'pro',
              prompt: prompt || 'Smooth video transition between frames',
              duration: parseInt(duration),
              aspect_ratio: '16:9',
              generate_audio: true,
              keep_original_sound: true,
              video_reference_type: 'feature',
              start_image: startImage,
              end_image: endImage,
            },
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to create video with kling-v3-omni-video')
        }

        prediction = await response.json()
      } else {
        // Use xai/grok-imagine-video for single image to video
        const response = await fetch('https://api.replicate.com/v1/models/xai/grok-imagine-video/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
            'Prefer': 'wait',
          },
          body: JSON.stringify({
            input: {
              prompt: prompt || 'smooth camera movement, gentle pan',
              image: imageUrl,
              duration: parseInt(duration),
              resolution: '720p',
              mode: 'normal',
            },
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to create video with grok-imagine-video: ${errorText}`)
        }

        prediction = await response.json()
      }

      // Success! Return response
      // Create notification for the user
      const modeLabel = mode === 'frames' ? 'Image Sequence' : 'Single Image'
      await createNotification({
        userId: userIdStr,
        type: 'job_completed',
        title: 'Video Creation Complete',
        message: `Your ${duration} second ${modeLabel} video is ready!`,
        data: { jobId: prediction.id, mode, duration }
      })

      return NextResponse.json({
        outputUrl: prediction.output,
        jobId: prediction.id,
        creditsUsed: creditCost,
        remainingCredits: await checkUserCredits(userIdStr),
        isWatermarked: false,
      })
    } catch (aiError) {
      // Refund credits on failure
      await refundCredits(userIdStr, `image_to_video_${duration}sec` as any, `video-${Date.now()}`)
      
      // Return mock response for demo
      return NextResponse.json({
        outputUrl: 'https://example.com/video.mp4',
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
