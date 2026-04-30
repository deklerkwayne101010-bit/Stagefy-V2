// Content Calendar API - CRUD operations for scheduled content
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

// GET /api/content/calendar - List calendar entries with optional date range
export async function GET(request: Request) {
  try {
    const user = await getUserFromAuthHeader(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const status = searchParams.get('status');

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    let query = supabase
      .from('content_calendar')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_date', { ascending: true });

    if (startDate) {
      query = query.gte('scheduled_date', startDate);
    }
    if (endDate) {
      query = query.lte('scheduled_date', endDate);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching calendar:', error);
      return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 });
    }

    return NextResponse.json({ entries: data || [] });

  } catch (error: any) {
    console.error('Calendar GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/content/calendar - Create single calendar entry
export async function POST(request: Request) {
  try {
    const user = await getUserFromAuthHeader(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      content_type,
      platform,
      caption,
      hashtags,
      template_type,
      template_prompt,
      scheduled_date,
      is_recurring,
      recurrence_pattern,
    } = body;

    if (!title || !scheduled_date) {
      return NextResponse.json(
        { error: 'Missing required fields: title, scheduled_date' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from('content_calendar')
      .insert({
        user_id: user.id,
        title,
        content_type,
        platform,
        caption,
        hashtags: hashtags || [],
        template_type: template_type || 'professional',
        template_prompt,
        scheduled_date,
        is_recurring: is_recurring || false,
        recurrence_pattern: recurrence_pattern || {},
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating calendar entry:', error);
      return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
    }

    return NextResponse.json({ entry: data });
  } catch (error: any) {
    console.error('Calendar POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

