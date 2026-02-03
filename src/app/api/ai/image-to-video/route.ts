// API route for Image to Video (Replicate)
import { NextResponse } from 'next/server'
import { 
  checkUserCredits, 
  reserveCredits, 
  refundCredits, 
  CREDIT_COSTS, 
  canPerformAction, 
  recordFreeUsage 
} from '@/lib/credits'
import { getCurrentUser } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { images, mode, duration, prompt, userId } = await request.json()

    // Validate input
    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: images' },
        { status: 400 }
      )
    }

    // Get user ID from auth or parameter
    const user = userId ? { id: userId } : await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userIdStr = user.id
    const durationKey = `${duration}sec` as '3sec' | '5sec' | '10sec'
    const creditCost = CREDIT_COSTS[`image_to_video_${durationKey}`]

    // Check if user can perform this action (free tier or credits)
    const canPerform = await canPerformAction(userIdStr)
    
    if (!canPerform.canPerform) {
      return NextResponse.json(
        { error: canPerform.error || 'Cannot perform action' },
        { status: 402 }
      )
    }

    // Track if using free tier
    let usingFreeTier = false
    let freeUsageRemaining = 0

    if (canPerform.reason === 'free_tier') {
      usingFreeTier = true
      freeUsageRemaining = canPerform.remaining || 0
    }

    // If using credits, reserve them
    if (!usingFreeTier) {
      const reservation = await reserveCredits(userIdStr, `image_to_video_${durationKey}` as any, `video-${Date.now()}`)
      if (!reservation.success) {
        return NextResponse.json(
          { error: reservation.error || 'Failed to reserve credits' },
          { status: 402 }
        )
      }
    }

    try {
      // Call Replicate API for video generation
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait',
        },
        body: JSON.stringify({
          version: 'anotherjesse/zeroscope-v2-xl-9c',
          input: {
            images: images,
            prompt: prompt || 'smooth camera movement',
            num_frames: duration * 8, // 8 fps
            width: 1024,
            height: 576,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create video')
      }

      const prediction = await response.json()

      // Record free tier usage if applicable
      if (usingFreeTier) {
        await recordFreeUsage(userIdStr, `image_to_video_${durationKey}` as any)
      }

      // Success! Return response
      return NextResponse.json({
        outputUrl: prediction.output,
        jobId: prediction.id,
        creditsUsed: usingFreeTier ? 0 : creditCost,
        remainingCredits: usingFreeTier ? 0 : (await checkUserCredits(userIdStr)),
        freeUsageRemaining: usingFreeTier ? freeUsageRemaining - 1 : 0,
        usingFreeTier,
        isWatermarked: usingFreeTier,
      })
    } catch (aiError) {
      // Refund credits on failure (only if we reserved them)
      if (!usingFreeTier) {
        await refundCredits(userIdStr, `image_to_video_${durationKey}` as any, `video-${Date.now()}`)
      }
      
      // Return mock response for demo
      return NextResponse.json({
        outputUrl: 'https://example.com/video.mp4',
        jobId: 'demo-job-' + Date.now(),
        creditsUsed: 0,
        remainingCredits: usingFreeTier ? 0 : await checkUserCredits(userIdStr),
        freeUsageRemaining: usingFreeTier ? freeUsageRemaining : 0,
        usingFreeTier,
        isWatermarked: usingFreeTier,
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
