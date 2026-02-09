// API route for AI Photo Editing (Qwen Image Edit Plus)
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
    const { image, referenceImage, prompt, userId } = await request.json()

    // Validate input
    if (!image || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: image and prompt' },
        { status: 400 }
      )
    }

    // Demo mode: allow requests without authentication
    let user: any = null
    if (isDemoMode) {
      user = { id: 'demo-user', credits: 50 }
    } else {
      // Get user ID from auth or parameter
      user = userId ? { id: userId } : await getCurrentUser()
      if (!user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    const userIdStr = user.id
    const creditCost = CREDIT_COSTS.photo_edit

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
        demoMessage: 'Demo mode: AI photo editing requires Supabase and Replicate API configuration. Set environment variables to enable.',
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
    const reservation = await reserveCredits(userIdStr, 'photo_edit', `photo-${Date.now()}`)
    if (!reservation.success) {
      return NextResponse.json(
        { error: reservation.error || 'Failed to reserve credits' },
        { status: 402 }
      )
    }

    try {
      // Call Replicate API for Qwen Image Edit Plus
      // Using the exact format from the model schema
      // Image array: [reference_image, target_image] - order matters for pose transfer
      
      const imageArray = referenceImage 
        ? [referenceImage, image]  // [pose/template, target] - matches curl example
        : [image]
      
      const inputPayload = {
        image: imageArray,
        prompt: prompt,
        go_fast: true,
        output_format: 'jpg',
        output_quality: 90,
      }

      const response = await fetch('https://api.replicate.com/v1/models/qwen/qwen-image-edit-plus/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait',  // Wait for prediction to complete
        },
        body: JSON.stringify({ input: inputPayload }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Replicate API error:', errorText)
        throw new Error(`Replicate API failed: ${errorText}`)
      }

      const prediction = await response.json()
      console.log('Replicate prediction:', prediction)

      // Success! Return response
      return NextResponse.json({
        outputUrl: prediction.output,
        jobId: prediction.id,
        creditsUsed: creditCost,
        remainingCredits: await checkUserCredits(userIdStr),
        isWatermarked: false,
      })
    } catch (aiError: any) {
      console.error('AI processing error:', aiError)
      
      // Refund credits on failure
      await refundCredits(userIdStr, 'photo_edit', `photo-${Date.now()}`)
      
      // Return mock response for demo
      return NextResponse.json({
        outputUrl: 'https://example.com/edited-image.jpg',
        jobId: 'demo-job-' + Date.now(),
        creditsUsed: 0,
        remainingCredits: await checkUserCredits(userIdStr),
        isWatermarked: false,
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
