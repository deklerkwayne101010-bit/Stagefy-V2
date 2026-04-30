// API route for AI Content Plan Generation
// Uses Replicate's GPT-4.1-nano to generate a month's worth of social media content ideas
import { NextResponse } from 'next/server'
import {
  checkUserCredits,
  reserveCredits,
  refundCredits,
  CREDIT_COSTS,
  canPerformAction
} from '@/lib/credits'
import { getCurrentUser } from '@/lib/supabase'

// Check if running in demo mode
const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function POST(request: Request) {
  try {
    const { duration, frequency, agentDetails } = await request.json()

    // Validate input
    if (!duration || !['1w', '2w', '1mo'].includes(duration)) {
      return NextResponse.json(
        { error: 'Invalid duration. Must be one of: 1w, 2w, 1mo' },
        { status: 400 }
      )
    }

    if (!frequency || !['2-3', 'daily'].includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency. Must be one of: 2-3, daily' },
        { status: 400 }
      )
    }

    // Get user from auth
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = user.id
    const creditCost = CREDIT_COSTS.content_plan_generation

    // Demo mode: return mock content plan
    if (isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 1500))

      const mockPlan = generateMockPlan(duration, frequency)
      return NextResponse.json({
        plan: mockPlan,
        creditsUsed: 0,
        remainingCredits: 50,
        demo: true,
        demoMessage: 'Demo mode: Content plan generation requires Supabase and Replicate API configuration.',
      })
    }

    // Check credits
    const canPerform = await canPerformAction(userId, creditCost)
    if (!canPerform.canPerform) {
      return NextResponse.json(
        { error: canPerform.error || 'Cannot perform action' },
        { status: 402 }
      )
    }

    // Reserve credits
    const reservation = await reserveCredits(userId, 'content_plan_generation', `content-plan-${Date.now()}`)
    if (!reservation.success) {
      return NextResponse.json(
        { error: reservation.error || 'Failed to reserve credits' },
        { status: 402 }
      )
    }

    try {
      // Calculate number of posts based on duration and frequency
      const weeks = duration === '1w' ? 1 : duration === '2w' ? 2 : 4
      const postsPerWeek = frequency === 'daily' ? 7 : 2.5 // 2-3 posts/week average to 2.5
      const totalPosts = Math.round(weeks * postsPerWeek)

      // Build agent context
      const agentContext = agentDetails
        ? `Agent details:
- Name: ${agentDetails.name || 'Real Estate Agent'}
- Brokerage: ${agentDetails.brokerage || 'Independent'}
- Specialties: ${(agentDetails.specialties || []).join(', ') || 'General real estate'}
- Target Market: ${agentDetails.targetMarket || 'Local buyers and sellers'}`
        : 'Agent: Real estate agent serving local buyers and sellers'

      // System prompt for content plan generation
      const systemPrompt = `You are an expert social media strategist for real estate agents. Generate a comprehensive content calendar plan for a real estate agent.

CREDIT COST: 2 credits for the full plan (+ 5 credits per visual if auto-generated).`

      const userPrompt = `Create a ${duration} content plan with approximately ${totalPosts} social media posts (${frequency === 'daily' ? 'posting daily' : '2-3 posts per week'}).

${agentContext}

Generate exactly ${totalPosts} post ideas spanning diverse content types:
1. Educational (buyer/seller guides, market updates, tips)
2. Community-focused (local events, neighborhood highlights)
3. Testimonial showcases
4. Behind-the-scenes (day in the life, office culture)
5. Property highlights (listings, open houses)
6. Personal branding (agent introduction, values, awards)
7. Interactive (polls, questions, user-generated content)
8. Seasonal/holiday content

For EACH post, provide a JSON object with these exact fields:
{
  "title": "Short catchy title (3-8 words)",
  "postType": "educational|community|testimonial|behind-the-scenes|listing|personal|interactive|seasonal",
  "caption": " engaging caption (100-200 words with emojis)",
  "hashtags": ["#hashtag1", "#hashtag2", ...] (8-12 relevant hashtags),
  "visualType": "professional|agent_showcase|testimonial|listing_promo|community|custom",
  "suggestedDay": 1-7 (relative day number within the first week, will be distributed across timeline),
  "callToAction": "Clear CTA text (e.g., 'Comment your questions below', 'Book a free consultation')"
}

CRITICAL REQUIREMENTS:
- Vary the visualType appropriately for each post type
- Include South African real estate context where relevant
- Use professional yet approachable tone
- Captions should be engaging and encourage interaction
- Hashtags should mix popular (#realestate) and niche (#CapeTownHomes) tags
- NO markdown formatting, raw JSON only

Return a single JSON object:
{
  "plan": [array of ${totalPosts} post objects as described above],
  "summary": {
    "totalPosts": ${totalPosts},
    "duration": "${duration}",
    "frequency": "${frequency}",
    "postTypeBreakdown": {counts per type}
  }
}`

      // Call Replicate API for GPT-4.1-nano
      const response = await fetch(
        'https://api.replicate.com/v1/models/openai/gpt-4.1-nano/predictions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
            'Prefer': 'wait',
          },
          body: JSON.stringify({
            input: {
              top_p: 1,
              prompt: userPrompt,
              messages: [{ role: 'system', content: systemPrompt }],
              image_input: [],
              temperature: 0.8,
              presence_penalty: 0,
              frequency_penalty: 0,
              max_completion_tokens: 8192,
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to generate content plan')
      }

      const prediction = await response.json()
      console.log('GPT-4.1-nano content plan response:', prediction)

      // Parse the output
      let output = prediction.output

      // Handle different output formats
      if (typeof output === 'string') {
        // Extract JSON from string
        const jsonMatch = output.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            output = JSON.parse(jsonMatch[0])
          } catch {
            throw new Error('Failed to parse JSON from AI response')
          }
        } else {
          throw new Error('No JSON found in AI response')
        }
      } else if (Array.isArray(output)) {
        output = output[output.length - 1]
      }

      if (!output || !output.plan || !Array.isArray(output.plan)) {
        throw new Error('Invalid response format from AI')
      }

      // Validate and normalize the plan
      const validatedPlan = output.plan.map((post: any, index: number) => ({
        title: post.title || `Post ${index + 1}`,
        postType: post.postType || 'educational',
        caption: post.caption || '',
        hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
        visualType: post.visualType || 'custom',
        suggestedDay: Math.min(Math.max(post.suggestedDay || 1, 1), 7),
        callToAction: post.callToAction || 'Share your thoughts in the comments!',
      }))

      return NextResponse.json({
        plan: validatedPlan,
        summary: output.summary || {
          totalPosts: validatedPlan.length,
          duration,
          frequency,
          postTypeBreakdown: {}
        },
        creditsUsed: creditCost,
        remainingCredits: await checkUserCredits(userId),
      })

    } catch (aiError: any) {
      console.error('AI content plan generation error:', aiError)

      // Refund credits on failure
      await refundCredits(userId, 'content_plan_generation', `content-plan-${Date.now()}`)

      return NextResponse.json(
        { error: aiError.message || 'Failed to generate content plan' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Content plan generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate mock content plan for demo/fallback
function generateMockPlan(duration: string, frequency: string) {
  const weeks = duration === '1w' ? 1 : duration === '2w' ? 2 : 4
  const postsPerWeek = frequency === 'daily' ? 7 : 3
  const totalPosts = weeks * postsPerWeek

  const mockPosts = [
    {
      title: "5 Tips for First-Time Home Buyers in 2026",
      postType: "educational",
      caption: "Buying your first home? Here are 5 essential tips to make the process smooth and successful! 🏠✨",
      hashtags: ["#FirstTimeHomeBuyer", "#HomeBuyingTips", "#RealEstateAdvice", "#PropertyTips", "#Homeownership"],
      visualType: "buyer_guide",
      suggestedDay: 1,
      callToAction: "Save this post for later! Which tip would you add?"
    },
    {
      title: "Market Update: This Month's Trends",
      postType: "educational",
      caption: "📊 Local market update: Inventory is up 15% and average days on market are down! Great news for buyers!",
      hashtags: ["#MarketUpdate", "#RealEstateMarket", "#PropertyNews", "#HomePrices", "#MarketTrends"],
      visualType: "professional",
      suggestedDay: 3,
      callToAction: "Questions about the market? Drop them below!"
    },
    {
      title: "Happy Client Alert! 🎉",
      postType: "testimonial",
      caption: "Thrilled to help Sarah & John find their dream home! Their smiles say it all 😊",
      hashtags: ["#ClientTestimonial", "#HappyClients", "#RealEstateSuccess", "#HomeSold", "#ClientLove"],
      visualType: "testimonial",
      suggestedDay: 5,
      callToAction: "Ready to find your dream home? DM me!"
    },
  ]

  // Duplicate and vary posts to reach totalPosts count
  const plan = []
  for (let i = 0; i < totalPosts; i++) {
    const base = mockPosts[i % mockPosts.length]
    plan.push({
      ...JSON.parse(JSON.stringify(base)),
      title: i < mockPosts.length ? base.title : `${base.title} (Part ${Math.floor(i/mockPosts.length)+1})`,
      suggestedDay: ((i % 7) + 1)
    })
  }

  return plan
}
