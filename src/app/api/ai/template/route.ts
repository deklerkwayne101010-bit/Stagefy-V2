// API route for AI Template Builder (Google Nano Banana Pro)
import { NextResponse } from 'next/server'
import { checkUserCredits, reserveCredits, refundCredits, CREDIT_COSTS } from '@/lib/credits'
import { getCurrentUser } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { images, type, prompt, userId } = await request.json()

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
    const creditCost = CREDIT_COSTS.template_generation

    // Check available credits
    const availableCredits = await checkUserCredits(userIdStr)
    if (availableCredits < creditCost) {
      return NextResponse.json(
        { error: `Insufficient credits. Need ${creditCost}, have ${availableCredits}` },
        { status: 402 }
      )
    }

    // Reserve credits before processing
    const reservation = await reserveCredits(userIdStr, 'template_generation', `template-${Date.now()}`)
    if (!reservation.success) {
      return NextResponse.json(
        { error: reservation.error || 'Failed to reserve credits' },
        { status: 402 }
      )
    }

    try {
      // Call Replicate API for template generation
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait',
        },
        body: JSON.stringify({
          version: 'google/nanobanana-pro',
          input: {
            images: images,
            template_type: type,
            prompt: prompt || 'Create a professional listing template',
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create template')
      }

      const prediction = await response.json()

      // Success! Credits already deducted on reservation
      return NextResponse.json({
        outputUrl: prediction.output,
        jobId: prediction.id,
        creditsUsed: creditCost,
        remainingCredits: availableCredits - creditCost,
      })
    } catch (aiError) {
      // Refund credits on failure
      await refundCredits(userIdStr, 'template_generation', `template-${Date.now()}`)
      
      // Return mock response for demo
      return NextResponse.json({
        outputUrl: 'https://example.com/template.jpg',
        jobId: 'demo-job-' + Date.now(),
        creditsUsed: 0,
        remainingCredits: availableCredits,
        demo: true,
      })
    }
  } catch (error) {
    console.error('Template generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
