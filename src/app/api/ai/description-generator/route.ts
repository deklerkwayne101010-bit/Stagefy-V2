// API route for AI Property Listing Description Generation
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

// Property style descriptions
const styleDescriptions: Record<string, string> = {
  'professional': 'professional and corporate tone, emphasizing value and investment potential',
  'warm-inviting': 'warm and welcoming tone, emphasizing comfort and family living',
  'luxury': 'elegant and sophisticated tone, emphasizing exclusivity and premium features',
  'modern': 'contemporary and sleek tone, emphasizing innovation and design',
  'family-friendly': 'family-oriented tone, emphasizing safety, space, and child-friendly features',
  'minimalist': 'clean and simple tone, emphasizing functionality and space',
}

// Output format configurations
const formatConfigs: Record<string, { wordCount: string; structure: string; extra: string }> = {
  'property24': {
    wordCount: '150-300 words',
    structure: 'standard property listing format with headline, property description, features list, and call-to-action',
    extra: 'Include property details, location highlights, and viewing contact information'
  },
  'tiktok': {
    wordCount: '50-100 words',
    structure: 'short, engaging caption with trending hashtags and hooks',
    extra: 'Use emojis, trending hashtags like #property #realestate #dreamhome, and include a strong hook'
  },
  'facebook': {
    wordCount: '150-250 words',
    structure: 'engaging post format with hook, property details, and engagement call-to-action',
    extra: 'Include emojis, ask questions to encourage comments, and add a clear CTA'
  },
  'instagram': {
    wordCount: '100-150 words',
    structure: 'visual-focused caption with line breaks, emojis, and hashtags',
    extra: 'Include 10-15 relevant hashtags (#realestate #property #home #luxuryliving etc.), use vertical spacing'
  },
  'twitter': {
    wordCount: '50-100 characters (very concise)',
    structure: 'punchy tweet with key selling point and hashtags',
    extra: 'Keep it extremely concise, use 2-3 relevant hashtags, focus on one key selling point'
  },
}

// Generate a description using OpenAI-compatible API (using Replicate or similar)
async function generateDescriptionWithAI(
  propertyType: string,
  listingStyle: string,
  outputFormat: string,
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
  const formatConfig = formatConfigs[outputFormat] || formatConfigs.property24

  let prompt = `Write a compelling real estate property listing description for a ${propertyType}.

Style: ${styleDesc}

Output Format: ${outputFormat.toUpperCase()}
- Word count: ${formatConfig.wordCount}
- Structure: ${formatConfig.structure}
- Extra requirements: ${formatConfig.extra}

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
1. Start with an attention-grabbing headline appropriate for ${outputFormat}
2. Write in a ${listingStyle} style that appeals to the target audience
3. Highlight the key features prominently
4. Include information about the property's location and nearby amenities
5. End with a compelling call-to-action encouraging buyers to schedule a viewing
6. Keep the description between ${formatConfig.wordCount}
7. Use appropriate formatting for ${outputFormat}
8. Make it ${outputFormat === 'instagram' || outputFormat === 'tiktok' ? 'SEO-friendly with relevant real estate hashtags' : 'SEO-friendly with relevant keywords'}
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
          content: `You are an expert real estate copywriter who creates compelling property listings for multiple platforms. You adapt your writing style and length based on the target platform (Property24, TikTok, Facebook, Instagram, Twitter/X). You write descriptions that highlight unique features, appeal to emotions, and drive buyer interest.`
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
  outputFormat: string,
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

  let description = ''

  switch (outputFormat) {
    case 'tiktok':
      description = `🏠 ${propertyTitle}\n\n✨ ${beds} ${baths} ${propertyType} with ${features}\n\n📍 ${address || 'Prime location'}\n\n💰 ${price || 'Contact for pricing'}\n\n#property #realestate #dreamhome #${propertyType} #home #luxuryliving`
      break
    case 'facebook':
      description = `${prefix} ${propertyTitle}! 🎉\n\nThis stunning ${beds} ${baths} ${propertyType} ${address ? `located at ${address}` : ''} is the perfect place to call home! 🏡\n\nKey Features:\n✨ ${features}\n\nWhy you'll love it:\n• Spacious and bright throughout\n• Perfect for families or investors\n• Close to all amenities\n\nContact us today to schedule a viewing! 👇\n\n${price ? `Priced at ${price}` : 'Contact for pricing'}`
      break
    case 'instagram':
      description = `${propertyTitle} ✨\n\n${beds} | ${baths} | ${propertyType}\n\n📍 ${address || 'Location available upon request'}\n\n${features}\n\nThis stunning property offers the perfect blend of comfort and style. Whether you're looking for a family home or an investment opportunity, this one has it all!\n\n🏠✨💫 #realestate #property #home #luxuryliving #dreamhome #${propertyType} #house #invest #southafrica #property24`
      break
    case 'twitter':
      description = `${propertyTitle} 🏠\n\n${beds} ${baths} ${propertyType} with ${features.split(',')[0].toLowerCase()}.\n\n${address ? address.split(',')[0] : 'Prime location'}\n\n${price || 'Contact for pricing'}\n\n#property #realestate`
      break
    default:
      // Property24 format (default)
      description = `${prefix} ${propertyTitle}.\n\nThis stunning ${beds} ${baths} ${propertyType} ${address ? `located at ${address}` : ''} offers an exceptional living experience. With its ${features}, this property is perfect for those seeking both comfort and style.\n\nThe thoughtfully designed layout maximizes space and natural light throughout. Whether you're looking for a family home, investment property, or personal sanctuary, this property delivers on all fronts.\n\nDon't miss this incredible opportunity to own a piece of paradise. Schedule your private viewing today and envision yourself living in this remarkable home.\n\n*This is a demo description. Connect your OpenAI API key for AI-generated descriptions.*`
  }

  return description.trim()
}

export async function POST(request: Request) {
  try {
    const {
      propertyType,
      listingStyle,
      outputFormat,
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

    // Demo mode: skip credit check and return demo response
    if (isDemoMode) {
      const description = generateDemoDescription(
        propertyType,
        listingStyle,
        outputFormat,
        propertyTitle,
        address,
        price,
        bedrooms,
        bathrooms,
        keyFeatures
      )
      
      return NextResponse.json({
        description,
        creditCost: 0,
        remainingCredits: 50,
        demo: true,
        demoMessage: 'Demo mode: AI description generation requires Supabase and OpenAI API configuration. Set environment variables to enable.',
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
    const reservation = await reserveCredits(userIdStr, 'description_generation', `desc-${Date.now()}`)
    if (!reservation.success) {
      return NextResponse.json(
        { error: reservation.error || 'Failed to reserve credits' },
        { status: 402 }
      )
    }

    try {
      // Generate the description
      let description: string

      if (process.env.OPENAI_API_TOKEN) {
        description = await generateDescriptionWithAI(
          propertyType,
          listingStyle,
          outputFormat,
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
          outputFormat,
          propertyTitle,
          address,
          price,
          bedrooms,
          bathrooms,
          keyFeatures
        )
      }

      return NextResponse.json({
        description,
        creditCost,
        remainingCredits: await checkUserCredits(userIdStr),
      })
    } catch (aiError) {
      console.error('AI generation error:', aiError)

      // Refund credits on failure
      await refundCredits(userIdStr, 'description_generation', `desc-${Date.now()}`)

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
