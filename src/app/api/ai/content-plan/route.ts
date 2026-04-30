// AI Content Plan Generation API
// Uses GPT-4.1-nano to generate diversified social media content plans
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Check if running in demo mode
const isDemoMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Helper to get user from Authorization header
async function getUserFromAuthHeader(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

// Replicate model for content planning
const REPLICATE_MODEL = 'openai/gpt-4.1-nano';

interface GenerateContentPlanRequest {
  duration: '1_week' | '2_weeks' | '1_month';
  frequency: 'twice_week' | 'three_times_week' | 'daily' | 'weekdays_only';
  topics?: string[]; // optional: ["buyers_guide", "market_update", ...]
  platforms: string[]; // ['facebook', 'instagram'] or ['facebook'] or ['instagram']
  start_date?: string; // ISO date
  agent_profile?: {
    name?: string;
    agency?: string;
    specialization?: string;
    location?: string;
  };
}

// Calculate number of posts based on duration and frequency
function calculatePostCount(duration: string, frequency: string): number {
  const days = {
    '1_week': 7,
    '2_weeks': 14,
    '1_month': 30,
  }[duration] || 7;

  const postsPerWeek = {
    'twice_week': 2,
    'three_times_week': 3,
    'daily': 7,
    'weekdays_only': 5,
  }[frequency] || 2;

  return Math.ceil((days / 7) * postsPerWeek);
}

export async function POST(request: Request) {
  try {
    const body: GenerateContentPlanRequest = await request.json();

    // Validate input
    if (!body.duration || !body.frequency || !body.platforms?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: duration, frequency, platforms' },
        { status: 400 }
      );
    }

    // Get current user
    let user: any = null;
    try {
      user = await getUserFromAuthHeader(request);
      if (!user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    } catch (err) {
      console.error('Error getting user:', err);
    }

    // Check Replicate API token
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateToken && !isDemoMode) {
      return NextResponse.json(
        { error: 'Replicate API not configured' },
        { status: 500 }
      );
    }

    // Calculate post count
    const postCount = calculatePostCount(body.duration, body.frequency);

    // Build system prompt for GPT-4.1-nano
    const systemPrompt = `You are an expert real estate social media strategist. Generate diverse, engaging social media post ideas for a real estate agent.

IMPORTANT: Return ONLY valid JSON, no other text.`;

    // Build user prompt
    const platformText = body.platforms.join(' and ');
    const durationText = {
      '1_week': '1 week',
      '2_weeks': '2 weeks',
      '1_month': '1 month',
    }[body.duration];

    const frequencyText = {
      'twice_week': '2 times per week',
      'three_times_week': '3 times per week',
      'daily': 'every day',
      'weekdays_only': 'on weekdays only',
    }[body.frequency];

    const topicsFilter = body.topics?.length
      ? `Focus on these content categories: ${body.topics.join(', ')}.`
      : 'Create diverse content across all categories: educational (tips, market updates, buyer guides), community-focused (local events, neighborhood highlights), social proof (testimonials, success stories), personal branding (agent intro, achievements), and promotional (listings, open houses).';

    const userPrompt = `Generate ${postCount} social media post ideas for a real estate agent.

AGENT PROFILE:
- Name: ${body.agent_profile?.name || 'Real Estate Agent'}
- Agency: ${body.agent_profile?.agency || 'Real Estate Agency'}
- Specialization: ${body.agent_profile?.specialization || 'General Real Estate'}
- Location: ${body.agent_profile?.location || 'Local Area'}
- Target audience: First-time homebuyers, investors, and local families

CONTENT PLAN:
- Duration: ${durationText}
- Frequency: ${frequencyText}
- Platforms: ${platformText}
- ${topicsFilter}

For EACH post idea, provide:
1. title: Short catchy title (max 50 chars)
2. description: 1-2 sentence summary of the post content
3. category: One of [listing, market_update, testimonial, buyers_guide, open_house, community, tip, promo, personal_brand]
4. suggested_caption: Full caption text with appropriate emojis, line breaks, and call-to-action. Keep it platform-appropriate (Instagram: shorter with emojis, Facebook: longer with engagement hooks)
5. hashtags: Array of 10-15 relevant hashtags (include location-specific and real estate tags)
6. visual_type: Which AI template type to use for the visual [professional, agent_showcase, testimonial, infographic, holiday]
7. visual_style_description: Brief description of what the visual should look like (e.g., "Modern clean layout with property photo prominent", "Agent portrait with quote overlay", "Infographic with market stats")
8. suggested_date: Date this post should be published (YYYY-MM-DD format) - spaced out according to frequency

CRITICAL REQUIREMENTS:
- Space posts evenly across the duration
- Mix up categories (don't post same type consecutively)
- Vary visual types for visual diversity
- Include local flavor (mention local area, landmarks, events when relevant)
- Make captions engaging and authentic (not salesy)
- Include clear call-to-actions
- Hashtags should be relevant and not repetitive

OUTPUT FORMAT (JSON only):
{
  "plan": [
    {
      "title": "...",
      "description": "...",
      "category": "...",
      "suggested_caption": "...",
      "hashtags": ["#tag1", "#tag2", ...],
      "visual_type": "professional",
      "visual_style_description": "...",
      "suggested_date": "2025-05-01"
    },
    ...
  ],
  "total_posts": N,
  "duration": "1_week",
  "platforms": ["facebook", "instagram"]
}`;

    // Demo mode: return mock response
    if (isDemoMode || !replicateToken) {
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate mock plan
      const mockPlan = [];
      const startDate = body.start_date
        ? new Date(body.start_date)
        : new Date();

      const categories = ['listing', 'market_update', 'testimonial', 'buyers_guide', 'community', 'tip', 'personal_brand'];
      const visualTypes = ['professional', 'agent_showcase', 'testimonial', 'infographic'];

      for (let i = 0; i < postCount; i++) {
        const postDate = new Date(startDate);
        postDate.setDate(startDate.getDate() + Math.floor(i * (30 / postCount)));

        const category = categories[Math.floor(Math.random() * categories.length)];
        const visualType = visualTypes[Math.floor(Math.random() * visualTypes.length)];

        mockPlan.push({
          title: `Post ${i + 1}: ${category.replace('_', ' ')}`,
          description: `A engaging ${category.replace('_', ' ')} post perfect for your audience.`,
          category,
          suggested_caption: `🏠 Check out this amazing ${category.replace('_', ' ')}!\n\nPerfect for ${body.agent_profile?.name || 'real estate agents'} looking to engage with their audience. #RealEstate #HomeGoals`,
          hashtags: ['#RealEstate', '#HomeGoals', '#DreamHome', '#Property', '#HouseHunting', '#LocationMatters'],
          visual_type: visualType,
          visual_style_description: `Professional ${visualType} template with modern design and clear typography.`,
          suggested_date: postDate.toISOString().split('T')[0],
        });
      }

      return NextResponse.json({
        plan: mockPlan,
        total_posts: postCount,
        duration: body.duration,
        platforms: body.platforms,
        demo: true,
      });
    }

    // Call Replicate API
    const response = await fetch(`https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${replicateToken}`,
        'Content-Type': 'application/json',
        Prefer: 'wait=300',
      },
      body: JSON.stringify({
        input: {
          prompt: userPrompt,
          system_prompt: systemPrompt,
          top_p: 1,
          temperature: 0.7,
          max_completion_tokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Replicate API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to generate content plan', details: errorText },
        { status: 500 }
      );
    }

    const prediction = await response.json();
    console.log('Content plan prediction:', prediction);

    // Parse output
    let output = prediction.output;
    if (typeof output === 'string') {
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          output = JSON.parse(jsonMatch[0]);
        } catch {
          console.error('Failed to parse JSON from output');
        }
      }
    } else if (Array.isArray(output)) {
      output = output[output.length - 1];
    }

    // Extract plan
    let plan: any[] = [];
    if (output?.plan && Array.isArray(output.plan)) {
      plan = output.plan;
    } else if (typeof output === 'object' && output !== null) {
      const values = Object.values(output);
      if (Array.isArray(values[0])) {
        plan = values[0] as any[];
      }
    }

    // Validate plan structure
    if (!Array.isArray(plan) || plan.length === 0) {
      return NextResponse.json(
        { error: 'Invalid plan format received from AI' },
        { status: 500 }
      );
    }

    // Ensure each post has required fields
    const validatedPlan = plan.map((post: any, index: number) => {
      const postDate = new Date(body.start_date || new Date());
      postDate.setDate(postDate.getDate() + Math.floor(index * (30 / postCount)));

      return {
        title: post.title || `Post ${index + 1}`,
        description: post.description || '',
        category: post.category || 'tip',
        suggested_caption: post.suggested_caption || '',
        hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
        visual_type: post.visual_type || 'professional',
        visual_style_description: post.visual_style_description || 'Professional real estate template',
        suggested_date: post.suggested_date || postDate.toISOString().split('T')[0],
      };
    });

    return NextResponse.json({
      plan: validatedPlan,
      total_posts: validatedPlan.length,
      duration: body.duration,
      platforms: body.platforms,
    });

  } catch (error: any) {
    console.error('Content plan generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
