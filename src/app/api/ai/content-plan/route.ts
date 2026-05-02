// AI Content Plan Generation API
// Uses openai/gpt-4.1-nano via Replicate to generate diversified social media content plans
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const replicateToken = process.env.REPLICATE_API_TOKEN;

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

interface GenerateContentPlanRequest {
  duration: '1_week' | '2_weeks' | '1_month';
  frequency: 'twice_week' | 'three_times_week' | 'daily' | 'weekdays_only';
  topics?: string[];
  platforms: string[];
  start_date?: string;
  agent_profile?: {
    name?: string;
    agency?: string;
    specialization?: string;
    location?: string;
  };
}

function calculatePostCount(duration: string, frequency: string): number {
  const days = { '1_week': 7, '2_weeks': 14, '1_month': 30 }[duration] || 7;
  const postsPerWeek = { 'twice_week': 2, 'three_times_week': 3, 'daily': 7, 'weekdays_only': 5 }[frequency] || 2;
  return Math.ceil((days / 7) * postsPerWeek);
}

export async function POST(request: Request) {
  try {
    const body: GenerateContentPlanRequest = await request.json();

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
    } catch (err) {
      console.error('Error getting user:', err);
    }

    const postCount = calculatePostCount(body.duration, body.frequency);

    // Generate mock plan for demo mode or if Replicate not available
    const generateMockPlan = () => {
      const mockPlan: any[] = [];
      const startDate = body.start_date ? new Date(body.start_date) : new Date();
      const categories = ['listing', 'market_update', 'testimonial', 'buyers_guide', 'community', 'tip', 'personal_brand'];
      const visualTypes = ['professional', 'agent_showcase', 'testimonial', 'infographic'];

      for (let i = 0; i < postCount; i++) {
        const postDate = new Date(startDate);
        postDate.setDate(startDate.getDate() + Math.floor(i * (30 / postCount)));
        const category = categories[Math.floor(Math.random() * categories.length)];
        const visualType = visualTypes[Math.floor(Math.random() * visualTypes.length)];

        mockPlan.push({
          title: `Post ${i + 1}: ${category.replace('_', ' ')}`,
          description: `An engaging ${category.replace('_', ' ')} post for your audience.`,
          category,
          suggested_caption: `🏠 ${body.agent_profile?.name || 'Real Estate Agent'} - ${category.replace('_', ' ')} opportunity!\n\nHelping buyers and sellers in the local area. Let's discuss your real estate goals! 🏡\n\n#RealEstate #HomeGoals #${category.replace('_', '')}`,
          hashtags: ['#RealEstate', '#HomeGoals', '#Property', `#${category.replace('_', '')}`, '#LocalArea', '#DreamHome'],
          visual_type: visualType,
          visual_style_description: `Professional ${visualType} design with modern typography and clean layout`,
          suggested_date: postDate.toISOString().split('T')[0],
        });
      }
      return mockPlan;
    };

    // Use mock plan if Replicate token not configured
    if (!replicateToken) {
      console.log('Replicate API token not configured - using generated plan');
      await new Promise(resolve => setTimeout(resolve, 800));
      const mockPlan = generateMockPlan();
      return NextResponse.json({
        plan: mockPlan,
        total_posts: postCount,
        duration: body.duration,
        platforms: body.platforms,
        generated: true,
      });
    }

    // Build prompt for GPT-4.1-nano
    const systemPrompt = `You are an expert real estate social media strategist. Generate diverse, engaging social media post ideas. Return ONLY valid JSON.`;

    const userPrompt = `Generate ${postCount} real estate social media posts.

AGENT: ${body.agent_profile?.name || 'Real Estate Agent'} | ${body.agent_profile?.agency || 'Agency'} | ${body.agent_profile?.location || 'Local Area'}

DURATION: ${body.duration} | FREQUENCY: ${body.frequency}
PLATFORMS: ${body.platforms.join(', ')}

${body.topics?.length ? `TOPICS: ${body.topics.join(', ')}` : ''}

OUTPUT JSON FORMAT:
{
  "plan": [
    {
      "title": "string (≤50 chars)",
      "description": "string",
      "category": "listing|market_update|testimonial|buyers_guide|community|tip|personal_brand",
      "suggested_caption": "string (with line breaks & emojis)",
      "hashtags": ["#tag1", "#tag2", ...],
      "visual_type": "professional|agent_showcase|testimonial|infographic",
      "visual_style_description": "string",
      "suggested_date": "YYYY-MM-DD"
    }
  ]
}`;

    // Call Replicate API with openai/gpt-4.1-nano
    const response = await fetch('https://api.replicate.com/v1/models/openai/gpt-4.1-nano/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${replicateToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait',
      },
      body: JSON.stringify({
        input: {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          top_p: 1,
          max_completion_tokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Replicate API error:', response.status, errorText);
      // Fall back to generated plan
      console.log('Falling back to generated plan');
      const mockPlan = generateMockPlan();
      return NextResponse.json({
        plan: mockPlan,
        total_posts: postCount,
        duration: body.duration,
        platforms: body.platforms,
        fallback: true,
      });
    }

    const prediction = await response.json();
    console.log('AI generation status:', prediction.status);

    // Parse output
    let output = prediction.output;
    if (typeof output === 'string') {
      try {
        output = JSON.parse(output);
      } catch (e) {
        // Try to extract JSON
        const jsonMatch = output.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try { output = JSON.parse(jsonMatch[0]); } catch {}
        }
      }
    }

    // Extract plan array
    let plan: any[] = [];
    if (output?.plan && Array.isArray(output.plan)) {
      plan = output.plan;
    } else if (Array.isArray(output)) {
      plan = output;
    } else if (typeof output === 'object' && output !== null) {
      const vals = Object.values(output);
      const arr = vals.find(v => Array.isArray(v));
      if (arr) plan = arr;
    }

    // Validate and normalize
    if (!Array.isArray(plan) || plan.length === 0) {
      console.log('Empty AI plan, using generated');
      const mockPlan = generateMockPlan();
      return NextResponse.json({ plan: mockPlan, total_posts: postCount, duration: body.duration, platforms: body.platforms });
    }

    const validatedPlan = plan.map((p: any, i: number) => {
      const pd = body.start_date ? new Date(body.start_date) : new Date();
      pd.setDate(pd.getDate() + Math.floor(i * (30 / postCount)));
      return {
        title: p.title || `Post ${i + 1}`,
        description: p.description || '',
        category: p.category || 'tip',
        suggested_caption: p.suggested_caption || '',
        hashtags: Array.isArray(p.hashtags) ? p.hashtags : [],
        visual_type: p.visual_type || 'professional',
        visual_style_description: p.visual_style_description || 'Professional design',
        suggested_date: p.suggested_date || pd.toISOString().split('T')[0],
      };
    });

    return NextResponse.json({
      plan: validatedPlan,
      total_posts: validatedPlan.length,
      duration: body.duration,
      platforms: body.platforms,
    });

  } catch (error: any) {
    console.error('Content plan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}