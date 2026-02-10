// API route for AI Template Builder (Google Nano Banana Pro)
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
        demoMessage: 'Demo mode: Template generation requires Supabase and Replicate API configuration. Set environment variables to enable.',
      })
    }

    // Check if user can perform this action (credits only)
    const canPerform = await canPerformAction(userIdStr, creditCost)
    
    if (!canPerform.canPerform) {
      return NextResponse.json(
        { error: canPerform.error || 'Cannot perform action' },
        { status: 402 }
      )
    }

    // Reserve credits
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
      await refundCredits(userIdStr, 'template_generation', `template-${Date.now()}`)
      
      // Return mock response for demo
      return NextResponse.json({
        outputUrl: 'https://example.com/template.jpg',
        jobId: 'demo-job-' + Date.now(),
        creditsUsed: 0,
        remainingCredits: await checkUserCredits(userIdStr),
        isWatermarked: true,
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
