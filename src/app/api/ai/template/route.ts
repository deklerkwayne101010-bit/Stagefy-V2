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
// Check if running in demo mode (server-side check)
// Demo mode if critical API keys are missing
const isDemoMode = !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.REPLICATE_API_TOKEN

// Also check public config
const hasPublicSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('API Environment check:', {
  isDemoMode,
  hasPublicSupabase,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  hasReplicateToken: !!process.env.REPLICATE_API_TOKEN
})

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

    console.log('User authenticated:', userIdStr)

    // Check if running in demo mode (skip if user is authenticated and API keys exist)
    if (isDemoMode && !process.env.REPLICATE_API_TOKEN) {
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
      // Get the exact number of property images uploaded
      const imageCount = images && images.length > 0 ? images.length : 0
      
      // Build input for Replicate API - Nano Banana 2 format
      const userPrompt = prompt || 'Create a professional listing template'
      
      // Get property image count to calculate agent/logo positions
      // Images array format: [property photos..., agent photo?, logo?]
      const propertyImageCount = imageCount
      const agentPhotoPosition = propertyImageCount + 1
      const logoPosition = propertyImageCount + (imageCount > 1 ? 2 : 1)
      
      // Check if this template type uses property photos
      const templatesWithPropertyPhotos = ['professional', 'custom']
      const usesPropertyPhotos = templatesWithPropertyPhotos.includes(type)
      
      // Templates that should NOT have any property photo instructions
      const templatesWithoutPropertyPhotos = ['agent_showcase', 'holiday_promo', 'testimonial', 'infographic']
      const skipPropertyInstructions = templatesWithoutPropertyPhotos.includes(type)
      
      // Use the wizard's prompt as-is - don't add any extra sections
      // The final prompt should be exactly what the wizard builds
      let finalPrompt = userPrompt
      
      console.log(`Template generation: ${propertyImageCount} property photo(s) uploaded`)

      // Select model - using GPT Image 2
      const modelId = 'openai/gpt-image-2'
      console.log(`Using model: ${modelId} for ${templateVersion} version`)

      // Build input for GPT Image 2
      const gptImageInput = {
        prompt: finalPrompt,
        quality: 'high',
        background: 'auto',
        moderation: 'auto',
        aspect_ratio: '1:1',
        input_images: images && images.length > 0 ? images : [],
        output_format: 'png',
        number_of_images: 1,
      }

      // Call Replicate API for template generation
      const response = await fetch(`https://api.replicate.com/v1/models/${modelId}/predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait',
        },
        body: JSON.stringify({
          input: gptImageInput,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Replicate API error:', response.status, errorText)
        throw new Error(`Failed to create template: ${response.status}`)
      }

      const prediction = await response.json()
      console.log('GPT Image 2 response:', prediction)
      console.log('GPT Image 2 output:', prediction.output)

      // Success! Return response
      // GPT Image 2 returns output as an array with the image URL
      let outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
      
      // Check if outputUrl is valid
      if (!outputUrl || typeof outputUrl !== 'string') {
        console.error('Invalid output URL:', outputUrl)
        return NextResponse.json({ 
          outputUrl: null,
          error: 'Failed to generate image - no output received',
          debug: prediction 
        })
      }
      
      console.log('Generated image URL:', outputUrl)
      
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
