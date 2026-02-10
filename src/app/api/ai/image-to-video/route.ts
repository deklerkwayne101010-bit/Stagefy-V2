// API route for Image to Video (Replicate)
import { NextResponse } from 'next/server'
import { 
  checkUserCredits, 
  reserveCredits, 
  refundCredits, 
  CREDIT_COSTS, 
  canPerformAction 
} from '@/lib/credits'
import { getCurrentUser } from '@/lib/supabase'

// Check if running in demo mode (no Supabase configured)
const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
    const reservation = await reserveCredits(userIdStr, `image_to_video_${durationKey}` as any, `video-${Date.now()}`)
    if (!reservation.success) {
      return NextResponse.json(
        { error: reservation.error || 'Failed to reserve credits' },
        { status: 402 }
      )
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

      // Success! Return response
      return NextResponse.json({
        outputUrl: prediction.output,
        jobId: prediction.id,
        creditsUsed: creditCost,
        remainingCredits: await checkUserCredits(userIdStr),
        isWatermarked: false,
      })
    } catch (aiError) {
      // Refund credits on failure
      await refundCredits(userIdStr, `image_to_video_${durationKey}` as any, `video-${Date.now()}`)
      
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
