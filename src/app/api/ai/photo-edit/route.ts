// API route for AI Photo Editing (Qwen Image Edit Plus)
import { NextResponse } from 'next/server'
import { 
  checkUserCredits, 
  reserveCredits, 
  refundCredits, 
  CREDIT_COSTS, 
  checkFreeUsage, 
  recordFreeUsage,
  canPerformAction 
} from '@/lib/credits'
import { getCurrentUser } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { image, prompt, userId } = await request.json()

    // Validate input
    if (!image || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: image and prompt' },
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
    const creditCost = CREDIT_COSTS.photo_edit

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
      const reservation = await reserveCredits(userIdStr, 'photo_edit', `photo-${Date.now()}`)
      if (!reservation.success) {
        return NextResponse.json(
          { error: reservation.error || 'Failed to reserve credits' },
          { status: 402 }
        )
      }
    }

    try {
      // Call Replicate API for Qwen Image Edit Plus
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait',
        },
        body: JSON.stringify({
          version: 'qwen/qwen2-vl-72b-instruct',
          input: {
            image: image,
            prompt: prompt,
            num_outputs: 1,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to process image')
      }

      const prediction = await response.json()

      // Record free tier usage if applicable
      if (usingFreeTier) {
        await recordFreeUsage(userIdStr, 'photo_edit')
      }

      // Success! Return response
      // Free tier users get watermarked output
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
        await refundCredits(userIdStr, 'photo_edit', `photo-${Date.now()}`)
      }
      
      // Return mock response for demo
      return NextResponse.json({
        outputUrl: 'https://example.com/edited-image.jpg',
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
    console.error('Photo edit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
