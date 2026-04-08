// API route for AI Template Builder (Google Nano Banana Pro)
import { NextResponse } from 'next/server'
import {
  checkUserCredits,
  reserveCredits,
  refundCredits,
  CREDIT_COSTS,
  canPerformAction
} from '@/lib/credits'
import { createClient } from '@supabase/supabase-js'
import { getAdminClient } from '@/lib/supabase'

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
    const { images, type, prompt, customOptions, version } = await request.json()

    // Validate input
    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: images' },
        { status: 400 }
      )
    }

    // Determine version (default to standard)
    const templateVersion = version || 'standard'
    const isPro = templateVersion === 'pro'
    
    // Set credit cost based on version
    const creditCost = isPro ? 5 : 3

    // Get user from Authorization header only
    const user = await getUserFromAuthHeader(request)
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userIdStr = user.id

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

    // Reserve credits using template_generation operation
    // The actual credit amount is determined by creditCost variable based on version
    const reservation = await reserveCredits(userIdStr, 'template_generation', `template-${Date.now()}`, creditCost)
    if (!reservation.success) {
      return NextResponse.json(
        { error: reservation.error || 'Failed to reserve credits' },
        { status: 402 }
      )
    }

    try {
      // RE/MAX brand colors
      const remaxColors = '#ff1300 (red), #5b0204 (maroon), #003bff (blue), #00102e (navy), #000000 (black), #f5f3ed (cream)'
      
      // Build input for Replicate API - Nano Banana 2 format
      const basePrompt = prompt || 'Create a professional listing template'
      const replicateInput = {
        prompt: `${basePrompt} Use these brand colors: ${remaxColors}`,
        resolution: '1K',
        image_input: images && images.length > 0 ? images : [],
        aspect_ratio: '4:3',
        output_format: 'png',
        google_search: false,
        image_search: true,
        safety_filter_level: 'block_only_high'
      }

      // Add custom template options if provided
      if (type === 'custom' && customOptions) {
        if (customOptions.colorTheme) {
          replicateInput.prompt += ` Use color theme: ${customOptions.colorTheme}`
        }
        if (customOptions.aspectRatio) {
          replicateInput.aspect_ratio = customOptions.aspectRatio
        }
      }

      // Select model based on version
      const modelId = isPro ? 'google/nano-banana-pro' : 'google/nano-banana-2'
      console.log(`Using model: ${modelId} for ${templateVersion} version`)

      // Call Replicate API for template generation
      const response = await fetch(`https://api.replicate.com/v1/models/${modelId}/predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait',
        },
        body: JSON.stringify({
          input: replicateInput,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create template')
      }

      const prediction = await response.json()
      console.log('Nano Banana Pro response:', prediction)

      // Success! Return response
      // Nano Banana Pro returns output as an array with the image URL
      let outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
      
      // Upload to Supabase storage for permanent URL
      try {
        const adminClient = getAdminClient()
        if (adminClient && outputUrl && !outputUrl.includes('example.com')) {
          // Download the image from Replicate
          const imageResponse = await fetch(outputUrl)
          if (imageResponse.ok) {
            const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
            const fileName = `templates/${userIdStr}/${Date.now()}.png`

            const { error: uploadError } = await adminClient.storage
              .from('ai-outputs')
              .upload(fileName, imageBuffer, {
                contentType: 'image/png',
                upsert: true,
              })

            if (!uploadError) {
              const { data: publicUrl } = adminClient.storage
                .from('ai-outputs')
                .getPublicUrl(fileName)
              outputUrl = publicUrl.publicUrl
              console.log('Uploaded template to storage:', outputUrl)
            } else {
              console.error('Failed to upload template:', uploadError)
            }
          }
        }
      } catch (uploadErr) {
        console.error('Error uploading to storage:', uploadErr)
        // Continue with original URL if upload fails
      }
      
      return NextResponse.json({
        outputUrl: outputUrl,
        jobId: prediction.id,
        creditsUsed: creditCost,
        remainingCredits: await checkUserCredits(userIdStr),
        isWatermarked: false,
      })
    } catch (aiError) {
      // Refund credits on failure - use same operation, pass the actual credit cost
      await refundCredits(userIdStr, 'template_generation', `template-${Date.now()}`, creditCost)
      
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
