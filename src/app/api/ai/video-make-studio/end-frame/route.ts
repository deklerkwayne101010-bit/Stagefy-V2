// Video Maker Studio - AI End Frame Generation
import { NextResponse } from 'next/server'
import { checkUserCredits, reserveCredits, refundCredits } from '@/lib/credits'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN!

const GPT_IMAGE_2_MODEL = 'openai/gpt-image-2'

async function getUserFromAuthHeader(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
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

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      headline: string
      cta: string
      backgroundColor: string
      propertyPrice?: string
      bedrooms?: string
      bathrooms?: string
      agentName: string
      phone?: string
      email?: string
      agency?: string
      photoUrl?: string | null
      logoUrl?: string | null
      width: number
      height: number
      quality?: string
    }

    const user = await getUserFromAuthHeader(request)
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const creditCost = 3
    const currentCredits = await checkUserCredits(user.id)
    if (currentCredits < creditCost) {
      return NextResponse.json(
        { error: `Insufficient credits. Need ${creditCost}, have ${currentCredits}` },
        { status: 402 }
      )
    }

    const reservation = await reserveCredits(user.id, 'template_generation', `endframe-${Date.now()}`, creditCost)
    if (!reservation.success) {
      return NextResponse.json(
        { error: reservation.error || 'Failed to reserve credits' },
        { status: 402 }
      )
    }

    const quality = body.quality === 'pro' ? 'high' : 'medium'

    const propertyDetails = [
      body.propertyPrice ? `Price: ${body.propertyPrice}` : '',
      body.bedrooms ? `${body.bedrooms} bed${body.bedrooms === '1' ? '' : 's'}` : '',
      body.bathrooms ? `${body.bathrooms} bath${body.bathrooms === '1' ? '' : 's'}` : '',
    ].filter(Boolean).join(', ')

    const inputImages: string[] = []
    if (body.photoUrl) inputImages.push(body.photoUrl)
    if (body.logoUrl) inputImages.push(body.logoUrl)

    const prompt = `Create a professional real estate video end frame template (${body.width}x${body.height}px). Design: clean, modern, premium look. Background color: ${body.backgroundColor}. Include large bold headline text: "${body.headline}". Agent name: "${body.agentName}". ${propertyDetails ? `Property details: ${propertyDetails}.` : ''} ${body.phone ? `Phone: ${body.phone}.` : ''} ${body.email ? `Email: ${body.email}.` : ''} ${body.agency ? `Agency: ${body.agency}.` : ''} Call to action: "${body.cta}". ${inputImages.length > 0 ? 'Use the provided reference images for the agent photo and agency logo, integrate them naturally into the layout.' : ''} No extra objects, no clutter, professional layout optimized for video ending.`

    const gptImageInput: any = {
      prompt,
      input_images: inputImages,
      quality,
      aspect_ratio: '16:9',
      output_format: 'png',
      background: 'auto',
      moderation: 'auto',
      number_of_images: 1,
    }

    const response = await fetch(`https://api.replicate.com/v1/models/${GPT_IMAGE_2_MODEL}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: gptImageInput,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create end frame: ${response.status} ${errorText}`)
    }

    let prediction = await response.json()

    if (prediction.status === 'starting' || prediction.status === 'processing') {
      const maxAttempts = 60
      let attempts = 0
      while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000))
        const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
          headers: {
            'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
          },
        })
        prediction = await statusResponse.json()
        attempts++
      }
    }

    if (prediction.status === 'failed') {
      throw new Error(`End frame generation failed: ${prediction.error || 'Unknown error'}`)
    }

    let outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output

    if (!outputUrl || typeof outputUrl !== 'string') {
      throw new Error('No output received from AI')
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)
    try {
      const imageResponse = await fetch(outputUrl)
      if (imageResponse.ok) {
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
        const fileName = `end-frames/${user.id}/${Date.now()}.png`
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
        }
      }
    } catch (uploadErr) {
      console.error('Error uploading end frame to storage:', uploadErr)
    }

    return NextResponse.json({
      outputUrl,
      jobId: prediction.id,
      creditsUsed: creditCost,
    })
  } catch (error) {
    console.error('End frame generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
