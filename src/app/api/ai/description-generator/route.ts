// API route for AI Property Listing Description Generation
import { NextResponse } from 'next/server'
import {
  checkUserCredits,
  reserveCredits,
  CREDIT_COSTS,
  checkFreeUsage,
  recordFreeUsage,
  canPerformAction
} from '@/lib/credits'
import { getCurrentUser } from '@/lib/supabase'

// Property style descriptions
const styleDescriptions: Record<string, string> = {
  'professional': 'professional and corporate tone, emphasizing value and investment potential',
  'warm-inviting': 'warm and welcoming tone, emphasizing comfort and family living',
  'luxury': 'elegant and sophisticated tone, emphasizing exclusivity and premium features',
  'modern': 'contemporary and sleek tone, emphasizing innovation and design',
  'family-friendly': 'family-oriented tone, emphasizing safety, space, and child-friendly features',
  'minimalist': 'clean and simple tone, emphasizing functionality and space',
}

// Generate a description using OpenAI-compatible API (using Replicate or similar)
async function generateDescriptionWithAI(
  propertyType: string,
  listingStyle: string,
  propertyTitle: string,
  address: string,
  price: string,
  bedrooms: string,
  bathrooms: string,
  squareFeet: string,
  yearBuilt: string,
  keyFeatures: string[],
  additionalNotes: string,
  targetAudience: string
): Promise<string> {
  // Build the prompt
  const styleDesc = styleDescriptions[listingStyle] || 'professional tone'

  let prompt = `Write a compelling real estate property listing description for a ${propertyType}.

Style: ${styleDesc}

Property Details:
- Title: ${propertyTitle}
- Address: ${address || 'Not specified'}
- Price: ${price || 'Not specified'}
- Bedrooms: ${bedrooms || 'Not specified'}
- Bathrooms: ${bathrooms || 'Not specified'}
- Square Feet: ${squareFeet || 'Not specified'}
- Year Built: ${yearBuilt || 'Not specified'}

Key Features: ${keyFeatures.length > 0 ? keyFeatures.join(', ') : 'None specified'}
Target Audience: ${targetAudience || 'General buyers'}
Additional Notes: ${additionalNotes || 'None'}`

  prompt += `

Requirements:
1. Start with an attention-grabbing headline
2. Write in a ${listingStyle} style that appeals to the target audience
3. Highlight the key features prominently
4. Include information about the property's location and nearby amenities
5. End with a compelling call-to-action encouraging buyers to schedule a viewing
6. Keep the description between 150-300 words
7. Use prose over lists where possible
8. Make it SEO-friendly with relevant keywords
9. Do not include any pricing in the description except what was provided
10. Do not include placeholders like [Insert XYZ] - use the information provided

Write the description now:`

  // Call OpenAI API (or compatible endpoint)
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert real estate copywriter who creates compelling property listings that sell homes. You write descriptions that highlight unique features, appeal to emotions, and drive buyer interest.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 600,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error('AI API error:', errorData)
    throw new Error('Failed to generate description')
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || 'Failed to generate description'
}

// Fallback demo description generator
function generateDemoDescription(
  propertyType: string,
  listingStyle: string,
  propertyTitle: string,
  address: string,
  price: string,
  bedrooms: string,
  bathrooms: string,
  keyFeatures: string[]
): string {
  const stylePrefix: Record<string, string> = {
    'professional': 'We are pleased to present',
    'warm-inviting': 'Welcome to your dream home at',
    'luxury': 'Experience unparalleled elegance at',
    'modern': 'Discover modern living at',
    'family-friendly': 'The perfect family home awaits you at',
    'minimalist': 'Find your peaceful retreat at',
  }

  const prefix = stylePrefix[listingStyle] || 'We are pleased to present'
  const beds = bedrooms ? `${bedrooms}-bedroom` : ''
  const baths = bathrooms ? `${bathrooms}-bathroom` : ''
  const features = keyFeatures.length > 0 ? keyFeatures.slice(0, 3).join(', ') : 'modern amenities'

  return `${prefix} ${propertyTitle}.

This stunning ${beds} ${baths} ${propertyType} ${address ? `located at ${address}` : ''} offers an exceptional living experience. With its ${features}, this property is perfect for those seeking both comfort and style.

The thoughtfully designed layout maximizes space and natural light throughout. Whether you're looking for a family home, investment property, or personal sanctuary, this property delivers on all fronts.

Don't miss this incredible opportunity to own a piece of paradise. Schedule your private viewing today and envision yourself living in this remarkable home.

*This is a demo description. Connect your OpenAI API key for AI-generated descriptions.*
  `.trim()
}

export async function POST(request: Request) {
  try {
    const {
      propertyType,
      listingStyle,
      propertyTitle,
      address,
      price,
      bedrooms,
      bathrooms,
      squareFeet,
      yearBuilt,
      keyFeatures,
      additionalNotes,
      targetAudience,
      userId
    } = await request.json()

    // Validate input
    if (!propertyType || !propertyTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyType and propertyTitle' },
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
    const creditCost = CREDIT_COSTS.description_generation || 2

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
      const reservation = await reserveCredits(userIdStr, 'description_generation', `desc-${Date.now()}`)
      if (!reservation.success) {
        return NextResponse.json(
          { error: reservation.error || 'Failed to reserve credits' },
          { status: 402 }
        )
      }
    }

    try {
      // Generate the description
      let description: string

      if (process.env.OPENAI_API_TOKEN) {
        description = await generateDescriptionWithAI(
          propertyType,
          listingStyle,
          propertyTitle,
          address,
          price,
          bedrooms,
          bathrooms,
          squareFeet,
          yearBuilt,
          keyFeatures,
          additionalNotes,
          targetAudience
        )
      } else {
        // Use demo generator
        description = generateDemoDescription(
          propertyType,
          listingStyle,
          propertyTitle,
          address,
          price,
          bedrooms,
          bathrooms,
          keyFeatures
        )
      }

      // Record free tier usage if applicable
      if (usingFreeTier) {
        await recordFreeUsage(userIdStr, 'description_generation')
      }

      // Determine if watermark should be shown
      const isWatermarked = usingFreeTier

      return NextResponse.json({
        description,
        isWatermarked,
        creditCost,
        usingFreeTier,
        freeUsageRemaining: usingFreeTier ? freeUsageRemaining - 1 : undefined,
      })
    } catch (aiError) {
      console.error('AI generation error:', aiError)

      // Refund credits if we reserved them
      if (!usingFreeTier) {
        await reserveCredits(userIdStr, 'description_generation', `desc-${Date.now()}`)
        // This is a refund operation - negative amount
        await (async () => {
          const { supabase } = await import('@/lib/supabase')
          await supabase.from('credit_transactions').insert({
            user_id: userIdStr,
            amount: -creditCost,
            type: 'refund',
            description: 'AI description generation failed - credits refunded',
          })
          await supabase
            .from('users')
            .update({ credits: (await checkUserCredits(userIdStr)) + creditCost })
            .eq('id', userIdStr)
        })()
      }

      return NextResponse.json(
        { error: 'Failed to generate description. Please try again.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Description generator error:', error)
    return NextResponse.json(
      { error: 'An error occurred while generating the description' },
      { status: 500 }
    )
  }
}
