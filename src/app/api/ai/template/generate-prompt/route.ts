// API route for Professional Template Prompt Generation
// Uses Replicate AI (GPT-4.1-nano model) to generate a unique prompt for Nano Banana Pro
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'
import {
  canPerformAction,
  reserveCredits,
  refundCredits,
  CREDIT_COSTS,
} from '@/lib/credits'
import { createClient } from '@supabase/supabase-js'

// Agency brand information mapping
interface AgencyBrandInfo {
  name: string
  colors: string
  style: string
}

function getAgencyInfo(agencySlug: string | null): AgencyBrandInfo | null {
  if (!agencySlug) return null
  
  const agencyMap: Record<string, AgencyBrandInfo> = {
    'remax': {
      name: 'RE/MAX',
      colors: 'RE/MAX Red (#E41E26) and White (#FFFFFF)',
      style: 'Professional, bold, with signature red accents'
    },
    'pam-golding': {
      name: 'Pam Golding Properties',
      colors: 'Gold (#C9A227) and Navy Blue (#1E3A5F)',
      style: 'Luxurious, elegant, with gold accents'
    },
    'seeff': {
      name: 'Seeff',
      colors: 'Seeff Green (#00A651) and White (#FFFFFF)',
      style: 'Fresh, professional, with green branding'
    },
    'era': {
      name: 'ERA',
      colors: 'ERA Blue (#005DAA) and White (#FFFFFF)',
      style: 'Modern, trustworthy, blue accents'
    },
    'century-21': {
      name: 'Century 21',
      colors: 'Century 21 Gold (#FFB400) and Black (#000000)',
      style: 'Premium, bold, gold and black combination'
    },
    'sothebys': {
      name: "Sotheby's International Realty",
      colors: 'Sotheby\'s Navy (#0C2340) and Gold (#C9A227)',
      style: 'Luxury, sophisticated, navy and gold'
    },
    'chesterton': {
      name: 'Chestertons',
      colors: 'Chestertons Teal (#008080) and Gold (#D4AF37)',
      style: 'Elegant, heritage, teal and gold'
    },
    'harvey': {
      name: 'Harvey Wilson Mattinson',
      colors: 'HWM Navy (#1B365D) and Burgundy (#800020)',
      style: 'Classic, prestigious, navy and burgundy'
    },
    'rawson': {
      name: 'Rawson Property Group',
      colors: 'Rawson Blue (#0066CC) and Orange (#FF6600)',
      style: 'Dynamic, modern, blue and orange'
    },
    'leapfrog': {
      name: 'Leapfrog Property Group',
      colors: 'Leapfrog Green (#7AB800) and White (#FFFFFF)',
      style: 'Friendly, fresh, green and white'
    },
    'engel-volkers': {
      name: 'Engel & Völkers',
      colors: 'E&V Navy (#002C5F) and White (#FFFFFF)',
      style: 'Premium, international, navy white'
    },
    'prop': {
      name: 'Prop',
      colors: 'Prop Red (#EE2537) and White (#FFFFFF)',
      style: 'Modern, vibrant, red accents'
    },
    'property-buddy': {
      name: 'Property Buddy',
      colors: 'Buddy Blue (#4A90D9) and Orange (#F5A623)',
      style: 'Friendly, modern, blue and orange'
    }
  }
  
  const slug = agencySlug.toLowerCase().replace(/\s+/g, '-')
  return agencyMap[slug] || null
}

// Check if running in demo mode
const isDemoMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Replicate model configuration for GPT-4.1-nano
const REPLICATE_MODEL = 'openai/gpt-4.1-nano'

interface PropertyDetails {
  header: string
  price: string
  location: string
  keyFeatures: string
  bedrooms: string
  bathrooms: string
  squareMeters: string
  propertyType: string
}

interface AgentProfile {
  agent_name: string
  phone: string
  email: string
  agency_brand?: string  // Agency brand name
}

interface PromptGenerationRequest {
  photoFrames: number
  includeAgent: boolean
  propertyDetails: PropertyDetails
  agencyBrand?: string  // Agency brand for styling
}

// Helper to get agent profile
async function getAgentProfile(userId: string): Promise<AgentProfile | null> {
  if (isDemoMode) {
    return {
      agent_name: 'John Doe',
      phone: '+27 82 123 4567',
      email: 'john@example.com'
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data, error } = await supabase
    .from('agent_profiles')
    .select('agent_name, phone, email, agency_brand')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    console.log('No agent profile found:', error)
    return null
  }

  return data
}

export async function POST(request: Request) {
  try {
    const body: PromptGenerationRequest = await request.json()
    const { photoFrames, includeAgent, propertyDetails } = body

    // Validate input
    if (!propertyDetails?.header) {
      return NextResponse.json(
        { error: 'Property header is required' },
        { status: 400 }
      )
    }

    // Get current user
    let user: any = null
    
    try {
      if (!isDemoMode) {
        user = await getCurrentUser()
      }
    } catch (err) {
      console.error('Error getting user:', err)
    }

    // Get agent profile if needed
    let agentProfile: AgentProfile | null = null
    if (includeAgent && user?.id) {
      agentProfile = await getAgentProfile(user.id)
    }

    // Get agency brand info
    const agencyBrand = agentProfile?.agency_brand || null
    
    // Map agency slug to full name and brand colors
    const agencyInfo = getAgencyInfo(agencyBrand)

    // Check if Replicate API token is configured
    const replicateToken = process.env.REPLICATE_API_TOKEN
    if (!replicateToken) {
      console.error('REPLICATE_API_TOKEN is not set in environment variables')
      return NextResponse.json(
        { 
          error: 'Replicate API not configured. Please add REPLICATE_API_TOKEN to your environment variables.',
          isConfigured: false 
        },
        { status: 500 }
      )
    }

    // Build the system prompt for GPT-4.1-nano
    const systemPrompt = `You are an expert real estate marketing designer specializing in creating 
stunning property listing templates. Your goal is to generate a UNIQUE, CREATIVE, and DETAILED 
prompt that can be used with Nano Banana Pro (AI image generation) to create a professional 
property marketing flyer.

IMPORTANT: Each prompt you generate must be completely unique and interesting. Use creative 
descriptions, unique layout suggestions, and varied styling approaches. Never repeat the same 
format twice.

Output ONLY valid JSON format.`

    // Build the user prompt with the new simplified structure
    const userPrompt = `Generate a completely unique and professional Nano Banana Pro prompt for a 
real estate marketing flyer with the following specifications:

## PHOTO FRAMES AND IMAGES CONFIGURATION
- ${photoFrames} photo frames
- IMPORTANT: The prompt MUST create space for EXACTLY ${photoFrames} property images in the template layout.

## PROPERTY DETAILS
- Header/Tagline: ${propertyDetails.header}
- Price: ${propertyDetails.price || 'Not specified'} must be in Rand
- Location: ${propertyDetails.location || 'Not specified'}
- Property Type: ${propertyDetails.propertyType || 'Property'}
- Bedrooms: ${propertyDetails.bedrooms || 'Not specified'}
- Bathrooms: ${propertyDetails.bathrooms || 'Not specified'}
- Square Meters: ${propertyDetails.squareMeters || 'Not specified'}
- Key Features: ${propertyDetails.keyFeatures || 'Not specified'}

${includeAgent && agentProfile ? `## AGENT PROFILE
- Include agent profile: Yes - include agent photo placeholder, name (${agentProfile.agent_name || 'Not specified'}), phone (${agentProfile.phone || 'Not specified'}), email (${agentProfile.email || 'Not specified'})` : '## AGENT PROFILE\n- Include agent profile: No'}

${agencyInfo ? `## AGENCY BRAND STYLING
- Agency: ${agencyInfo.name}
- IMPORTANT: The template MUST follow ${agencyInfo.name}'s brand colors (${agencyInfo.colors}) and professional styling guidelines. Use their logo style and color scheme throughout the design.` : ''}

## REQUIREMENTS
Generate a JSON response with these fields:
{
  "prompt": "A detailed, creative prompt for Nano Banana Pro that describes the entire flyer layout including: header design, photo frame arrangement, property information placement, agent section (if applicable), color scheme, typography, and visual style. Be very specific and creative!",
  "layoutSuggestions": ["Specific layout suggestion 1", "Specific layout suggestion 2", "Specific layout suggestion 3"],
  "styleGuidelines": "Specific style guidelines describing the visual aesthetic, color palette, typography, and mood"
}

The prompt must be in English, be highly detailed, and describe a visually stunning flyer. 
Make it unique and different from generic templates!`

    // Try to call Replicate AI with GPT-4.1-nano
    try {
      const response = await fetch(
        'https://api.replicate.com/v1/models/openai/gpt-4.1-nano/predictions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
            Prefer: 'wait',
          },
          body: JSON.stringify({
            input: {
              top_p: 1,
              prompt: userPrompt,
              messages: [],
              image_input: [],
              temperature: 0.8,
              system_prompt: systemPrompt,
              presence_penalty: 0,
              frequency_penalty: 0,
              max_completion_tokens: 4096,
            },
          }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Replicate API error:', errorText)
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.detail || errorJson.message || JSON.stringify(errorJson))
        } catch {
          throw new Error(`Replicate API failed: ${errorText.substring(0, 200)}`)
        }
      }

      const prediction = await response.json()
      console.log('Replicate GPT-4.1-nano prediction:', prediction)

      // Parse the output from GPT-4.1-nano
      let output = prediction.output
      
      // Log the output for debugging
      console.log('Output type:', typeof output)
      console.log('Output:', output)
      
      // Parse the output - handle various response formats
      if (typeof output === 'string') {
        // Try to extract JSON from the string
        const jsonMatch = output.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            output = JSON.parse(jsonMatch[0])
          } catch {
            // If JSON parsing fails, treat the entire string as the prompt
            output = {
              prompt: output,
              layoutSuggestions: [
                'Modern grid layout with equal-sized photo frames',
                'Header banner with gradient background',
                'Property details in clean card design',
              ],
              styleGuidelines:
                'Professional real estate marketing style with clean typography and bold colors',
            }
          }
        } else {
          // No JSON found, use the entire string as the prompt
          output = {
            prompt: output,
            layoutSuggestions: [
              'Modern grid layout with equal-sized photo frames',
              'Header banner with gradient background',
              'Property details in clean card design',
            ],
            styleGuidelines:
              'Professional real estate marketing style with clean typography and bold colors',
          }
        }
      } else if (Array.isArray(output)) {
        // Sometimes the output is an array - take the last element
        output = output[output.length - 1]
      }

      // Ensure all required fields exist
      const result = {
        prompt: output?.prompt || generateMockPrompt(photoFrames, includeAgent, propertyDetails).prompt,
        layoutSuggestions: output?.layoutSuggestions || [],
        styleGuidelines: output?.styleGuidelines || '',
      }

      console.log('Returning result:', result)

      // Return successful response
      return NextResponse.json(result)
    } catch (aiError: any) {
      console.error('AI processing error:', aiError)

      // Refund credits on failure (only if user was logged in)
      if (user?.id) {
        await refundCredits(user.id, 'prompt_generation', `prompt-${Date.now()}`)
      }

      // Return fallback response
      return NextResponse.json(
        generateMockPrompt(photoFrames, includeAgent, propertyDetails)
      )
    }
  } catch (error) {
    console.error('Prompt generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to generate mock prompt (fallback)
function generateMockPrompt(
  photoFrames: number,
  includeAgent: boolean,
  propertyDetails: PropertyDetails
) {
  const layouts: Record<number, string> = {
    1: 'Single large hero image with full-width banner',
    2: 'Two equal columns side by side',
    3: 'One large main image with two smaller below',
    4: '2x2 grid with equal square images',
    5: 'One large featured image with 4 smaller in grid',
    6: '2x3 grid with uniform rectangle images',
  }
  const layoutSuggestion = layouts[photoFrames] || 'Custom grid layout'

  const prompt = `Create a stunning professional real estate marketing flyer with the following specifications:

HEADER: A bold header banner with "${propertyDetails.header}" text in modern sans-serif typography, gradient background using premium real estate brand colors (deep blue to teal), with subtle geometric patterns.

PHOTO LAYOUT: ${layoutSuggestion}. Each photo frame should have rounded corners, subtle drop shadows, and space for property images. The frames should be arranged in an aesthetically pleasing ${photoFrames > 3 ? 'asymmetric' : 'symmetric'} grid.

PROPERTY INFO SECTION:
- Price prominently displayed: ${propertyDetails.price || 'R[PRICE]'} in large bold typography
- Location: ${propertyDetails.location || '[LOCATION]'}
- Property type badge: ${propertyDetails.propertyType || 'Property'}
- Stats row showing ${propertyDetails.bedrooms || 'X'} beds, ${propertyDetails.bathrooms || 'X'} baths, ${propertyDetails.squareMeters || 'XXX'}m²
- Key features list: ${propertyDetails.keyFeatures || 'Feature 1, Feature 2, Feature 3'}

${includeAgent ? 'AGENT PROFILE SECTION: Include a circular agent photo placeholder, agent name in bold, phone number, email address, and a professional "For more info contact" header. Place this in a contrasting colored card.' : ''}

STYLE: Modern, luxurious real estate marketing aesthetic. Use a clean white/light gray background with bold accent colors. Include subtle shadows, rounded corners, and professional typography. The overall look should be premium, trustworthy, and eye-catching.

DIMENSIONS: Standard A4 flyer proportions (210mm x 297mm), print-ready with 3mm bleed.`

  return {
    prompt,
    layoutSuggestions: [
      layoutSuggestion,
      'Header with gradient banner design',
      includeAgent
        ? 'Agent contact card with photo placeholder'
        : 'Clean footer with agency branding',
    ],
    styleGuidelines:
      'Modern luxury real estate aesthetic. White background with deep blue (#1e40af) and teal (#0d9488) accent colors. Clean sans-serif fonts (Inter or Roboto). Subtle shadows and rounded corners. Professional and premium look.',
  }
}
