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
    const days = { '1_week': 7, '2_weeks': 14, '1_month': 30 }[body.duration] || 7;

    // Generate mock plan for demo mode or if Replicate not available
    const generateMockPlan = () => {
      const mockPlan: any[] = [];
      const startDate = body.start_date ? new Date(body.start_date) : new Date();
      
      const categories = [
        { id: 'listing', label: 'New Property Listing', descr: 'Fresh listing just hit the market' },
        { id: 'market_update', label: 'Market Update', descr: 'Latest trends and local market insights' },
        { id: 'testimonial', label: 'Client Testimonial', descr: 'Happy client shares their experience' },
        { id: 'buyers_guide', label: 'Buyer Tips', descr: 'Essential tips for first-time homebuyers' },
        { id: 'community', label: 'Local Community', descr: 'Neighborhood highlights and local events' },
        { id: 'tip', label: 'Real Estate Tip', descr: 'Quick tips for sellers and investors' },
        { id: 'personal_brand', label: 'Meet the Agent', descr: 'Personal branding and professional highlights' },
      ];
      const visualTypes = [
        { id: 'professional', descr: 'Modern real estate design with property focus' },
        { id: 'agent_showcase', descr: 'Agent-centered profile showcase' },
        { id: 'testimonial', descr: 'Client review and testimonial highlight' },
        { id: 'infographic', descr: 'Data-driven market stats infographic' },
      ];

      for (let i = 0; i < postCount; i++) {
        const postDate = new Date(startDate);
        const spacing = Math.floor((days / postCount) * i);
        postDate.setDate(startDate.getDate() + spacing);
        
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const vtype = visualTypes[Math.floor(Math.random() * visualTypes.length)];

        const titles = [
          `${cat.label}`,
          `${cat.label} in ${body.agent_profile?.location || 'Your Area'}`,
          `Why ${cat.label} Matters`,
          `${cat.label} Spotlight`,
        ];
        const title = titles[Math.floor(Math.random() * titles.length)];

        mockPlan.push({
          title,
          description: cat.descr + ' - crafted to engage and inform your audience.',
          category: cat.id,
          suggested_caption: `🏠 ${title}\\n\\n${cat.descr}.\\n\\nReady to take the next step? Reach out today! 📞✨\\n\\n#RealEstate #${cat.id.replace('_', '')}`,
          hashtags: [`#RealEstate`, `#${cat.id.replace('_', '')}`, `#${body.agent_profile?.location?.split(',')[0].replace(/\\s+/g, '') || 'Property'}`, `#HomeGoals`],
          visual_type: vtype.id,
          visual_style_description: vtype.descr,
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
      console.log('Falling back to generated plan');
      const mockPlan = generateMockPlan();
      return NextResponse.json({ plan: mockPlan, total_posts: postCount, duration: body.duration, platforms: body.platforms, fallback: true });
    }

    const prediction = await response.json();
    console.log('AI generation status:', prediction.status);

    // Parse output
    const rawOutput = prediction.output;
    console.log('Raw output type:', typeof rawOutput);
    
    let parsedOutput = rawOutput;
    if (typeof rawOutput === 'string') {
      try {
        parsedOutput = JSON.parse(rawOutput);
        console.log('Successfully parsed string to JSON, keys:', Object.keys(parsedOutput));
      } catch (e) {
        const err = e as Error;
        console.error('JSON parse error:', err.message, 'Output preview:', rawOutput.substring(0, 500));
        const jsonMatch = rawOutput.match(/\\{[\\s\\S]*\\}/);
        if (jsonMatch) {
          try {
            parsedOutput = JSON.parse(jsonMatch[0]);
            console.log('Extracted JSON successfully');
          } catch (e2) {
            const err2 = e2 as Error;
            console.error('Extracted JSON parse also failed:', err2.message);
            parsedOutput = null;
          }
        } else {
          parsedOutput = null;
        }
      }
    }
    
    if (!parsedOutput) {
      console.error('No valid output from AI, falling back to generated plan');
      const mockPlan = generateMockPlan();
      return NextResponse.json({ plan: mockPlan, total_posts: postCount, duration: body.duration, platforms: body.platforms, fallback: true });
    }
    
    console.log('Output is now type:', typeof parsedOutput, 'keys:', Object.keys(parsedOutput));

    // Extract plan array
    let plan: any[] = [];
    if (parsedOutput?.plan && Array.isArray(parsedOutput.plan)) {
      plan = parsedOutput.plan;
      console.log('Found plan array with', plan.length, 'items');
    } else if (Array.isArray(parsedOutput)) {
      plan = parsedOutput;
      console.log('Output is direct array with', plan.length, 'items');
    } else if (typeof parsedOutput === 'object' && parsedOutput !== null) {
      const vals = Object.values(parsedOutput);
      const arr = vals.find(v => Array.isArray(v));
      if (arr) {
        plan = arr;
        console.log('Found nested array with', plan.length, 'items');
      }
    }

    // Validate and normalize
    if (!Array.isArray(plan) || plan.length === 0) {
      console.log('Empty AI plan, using generated');
      const mockPlan = generateMockPlan();
      return NextResponse.json({ plan: mockPlan, total_posts: postCount, duration: body.duration, platforms: body.platforms, fallback: 'empty' });
    }
    
    // Safety: if plan has ridiculous number of items, use generated instead
    if (plan.length > postCount * 3) {
      console.log(`AI returned ${plan.length} items (expected max ${postCount}), using generated`);
      const mockPlan = generateMockPlan();
      return NextResponse.json({ plan: mockPlan, total_posts: postCount, duration: body.duration, platforms: body.platforms, fallback: 'too_many' });
    }

    const validatedPlan = plan.map((p: any, i: number) => {
      const pd = body.start_date ? new Date(body.start_date) : new Date();
      pd.setDate(pd.getDate() + Math.floor(i * (days / postCount)));
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
