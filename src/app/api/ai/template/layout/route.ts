// API route for Qwen Layout Generation
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'
import { 
  canPerformAction,
  reserveCredits, 
  refundCredits, 
  CREDIT_COSTS 
} from '@/lib/credits'

// Check if running in demo mode
const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Qwen model configuration for layout generation
const QWEN_MODEL_CONFIG = {
  model: 'qwen/qwen3-235b-a22b-instruct-2507',
  temperature: 0.7,
  max_tokens: 4000,
}

interface LayoutGenerationRequest {
  templateCategory: string
  propertyType?: string
  brandPrimaryColor?: string
  brandName?: string
  userPreferences?: {
    styleKeywords?: string[]
    specialRequirements?: string
  }
}

export async function POST(request: Request) {
  try {
    const body: LayoutGenerationRequest = await request.json()
    const { templateCategory, propertyType, brandPrimaryColor, brandName, userPreferences } = body

    // Validate input
    if (!templateCategory) {
      return NextResponse.json(
        { error: 'Template category is required' },
        { status: 400 }
      )
    }

    // Get current user
    let user: any = null
    if (!isDemoMode) {
      user = await getCurrentUser()
      if (!user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    const creditCost = CREDIT_COSTS.template_generation

    // Demo mode: return mock response
    if (isDemoMode) {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Return mock layout generation response
      return NextResponse.json({
        prompt: generateMockPrompt(templateCategory, propertyType, brandPrimaryColor),
        layoutStructure: generateMockLayoutStructure(templateCategory),
        estimatedTokens: 1500,
        demo: true,
        demoMessage: 'Demo mode: Layout generation requires Supabase and Replicate API configuration.',
      })
    }

    // Check if user can perform this action
    const { canPerform, error } = await canPerformAction(user.id, creditCost)
    if (!canPerform) {
      return NextResponse.json(
        { error: error || 'Insufficient credits for layout generation' },
        { status: 402 }
      )
    }

    // Reserve credits
    const reservation = await reserveCredits(user.id, 'template_generation', `layout-${Date.now()}`)
    if (!reservation.success) {
      return NextResponse.json(
        { error: reservation.error || 'Failed to reserve credits' },
        { status: 402 }
      )
    }

    try {
      // Build the system prompt for Qwen
      const systemPrompt = `You are an expert real estate marketing designer. 
Generate unique, professional property listing template layouts with specific 
formatting, structure, content placeholders, and styling specifications.
Always output valid JSON format.`

      // Build the user prompt
      const userPrompt = `Generate a completely unique and perfectly structured prompt layout 
and styling specifically designed for a ${templateCategory} professional property 
listing template${propertyType ? ` for a ${propertyType}` : ''}.

${brandName ? `BRAND REQUIREMENTS:
- Brand Name: ${brandName}
- Primary Brand Color: ${brandPrimaryColor || '#1e40af'}
- Apply these brand colors consistently throughout the template
- Follow ${brandName}'s typical visual identity patterns` : ''}

${userPreferences?.styleKeywords?.length ? `Style Keywords: ${userPreferences.styleKeywords.join(', ')}` : ''}
${userPreferences?.specialRequirements ? `Special Requirements: ${userPreferences.specialRequirements}` : ''}

REQUIRED OUTPUT FORMAT:
Return a JSON object with:
1. "prompt": A detailed prompt for Nano Banana to generate the template
2. "layoutStructure": Object with "sections" array containing:
   - id: section identifier
   - name: section name
   - type: section type (header, hero, gallery, features, details, contact, footer)
   - order: display order
   - style: object with styling rules
3. "placeholders": Object mapping placeholder IDs to their properties:
   - type: content type (text, image, number, date)
   - style: styling rules
   - content_type: what kind of content belongs here

Example structure:
{
  "prompt": "Create a professional property listing template with...",
  "layoutStructure": {
    "sections": [
      {"id": "header", "name": "Brand Header", "type": "header", "order": 1, "style": {...}},
      {"id": "hero", "name": "Hero Image", "type": "hero", "order": 2, "style": {...}}
    ]
  },
  "placeholders": {
    "hero_image": {"type": "image", "style": {...}, "content_type": "image"},
    "property_price": {"type": "number", "style": {...}, "content_type": "number"}
  }
}`

      // Call Qwen model
      const response = await fetch('https://api.replicate.com/v1/models/qwen/qwen3-235b-a22b-instruct-2507/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait',
        },
        body: JSON.stringify({
          input: {
            prompt: userPrompt,
            system: systemPrompt,
            temperature: QWEN_MODEL_CONFIG.temperature,
            max_tokens: QWEN_MODEL_CONFIG.max_tokens,
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Qwen API error:', errorText)
        throw new Error(`Qwen API failed: ${errorText}`)
      }

      const prediction = await response.json()
      console.log('Qwen layout prediction:', prediction)

      // Parse the output (expecting JSON)
      let output = prediction.output
      if (typeof output === 'string') {
        try {
          output = JSON.parse(output)
        } catch {
          // If not valid JSON, wrap in prompt object
          output = {
            prompt: output,
            layoutStructure: generateMockLayoutStructure(templateCategory),
            placeholders: {},
          }
        }
      }

      // Return successful response
      return NextResponse.json({
        prompt: output.prompt || generateMockPrompt(templateCategory, propertyType, brandPrimaryColor),
        layoutStructure: output.layoutStructure || generateMockLayoutStructure(templateCategory),
        estimatedTokens: prediction.metrics?.predict_time_ms ? Math.round(prediction.metrics.predict_time_ms / 10) : 1500,
      })
    } catch (aiError: any) {
      console.error('AI processing error:', aiError)
      
      // Refund credits on failure
      await refundCredits(user.id, 'template_generation', `layout-${Date.now()}`)
      
      // Return fallback response
      return NextResponse.json({
        prompt: generateMockPrompt(templateCategory, propertyType, brandPrimaryColor),
        layoutStructure: generateMockLayoutStructure(templateCategory),
        estimatedTokens: 1500,
        fallback: true,
      })
    }
  } catch (error) {
    console.error('Layout generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate mock prompt
function generateMockPrompt(
  category: string,
  propertyType?: string,
  brandColor?: string
): string {
  const basePrompt = `Create a professional ${category} property listing template with the following specifications:

## Header Section
- Include brand logo/name area at the top
- Brand tagline placement
- Professional header styling with ${brandColor || 'blue'} accent color

## Hero Section
- Large hero image placeholder (16:9 aspect ratio)
- Property title overlay area
- Price display with currency formatting
- Quick property stats bar (beds, baths, sqft)

## Gallery Section
- Image gallery grid (3-4 images)
- Thumbnail carousel navigation
- Image caption areas

## Property Details Section
- Feature list with icons
- Room dimensions
- Property specifications table
- Description text area

## Contact Section
- Agent photo placeholder (circular)
- Agent contact information
- Agency branding area
- Call-to-action buttons

## Footer
- Copyright and branding
- Social media links
- Legal disclaimer area

Style: ${category} aesthetic with clean, modern design principles.`
  
  return basePrompt
}

// Helper function to generate mock layout structure
function generateMockLayoutStructure(category: string): {
  sections: Array<{
    id: string
    name: string
    type: string
    order: number
    style: Record<string, unknown>
  }>
} {
  return {
    sections: [
      {
        id: 'header',
        name: 'Brand Header',
        type: 'header',
        order: 1,
        style: {
          height: '80px',
          backgroundColor: '#ffffff',
          borderBottom: '2px solid #e5e7eb',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
      },
      {
        id: 'hero',
        name: 'Hero Image',
        type: 'hero',
        order: 2,
        style: {
          height: '400px',
          position: 'relative',
          backgroundColor: '#f3f4f6',
        },
      },
      {
        id: 'property_info',
        name: 'Property Info',
        type: 'details',
        order: 3,
        style: {
          padding: '24px',
          backgroundColor: '#ffffff',
        },
      },
      {
        id: 'gallery',
        name: 'Image Gallery',
        type: 'gallery',
        order: 4,
        style: {
          padding: '24px',
          backgroundColor: '#f9fafb',
        },
      },
      {
        id: 'features',
        name: 'Property Features',
        type: 'features',
        order: 5,
        style: {
          padding: '24px',
          backgroundColor: '#ffffff',
        },
      },
      {
        id: 'description',
        name: 'Property Description',
        type: 'details',
        order: 6,
        style: {
          padding: '24px',
          backgroundColor: '#f9fafb',
        },
      },
      {
        id: 'contact',
        name: 'Agent Contact',
        type: 'contact',
        order: 7,
        style: {
          padding: '24px',
          backgroundColor: '#1e40af',
          color: '#ffffff',
        },
      },
      {
        id: 'footer',
        name: 'Footer',
        type: 'footer',
        order: 8,
        style: {
          padding: '24px',
          backgroundColor: '#111827',
          color: '#9ca3af',
        },
      },
    ],
  }
}
