// Content Calendar API - CRUD operations for scheduled content
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

// Create authenticated client with service role for admin operations
function getServiceClient() {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
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

    const supabase = getServiceClient();
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
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: `Failed to fetch calendar: ${error.message}`, details: error }, { status: 500 });
    }

    console.log(`Fetched ${data?.length || 0} calendar entries for user ${user.id}`);
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
      generated_image_url,
    } = body;

    if (!title || !scheduled_date) {
      return NextResponse.json(
        { error: 'Missing required fields: title, scheduled_date' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();
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
        generated_image_url: generated_image_url || null,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating calendar entry:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: `Failed to create entry: ${error.message}`, details: error }, { status: 500 });
    }

    console.log('Successfully created calendar entry:', data);
    return NextResponse.json({ entry: data });
  } catch (error: any) {
    console.error('Calendar POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/content/calendar - Update calendar entry (for adding images)
export async function PUT(request: Request) {
  try {
    const user = await getUserFromAuthHeader(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Entry ID required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Ensure user can only update their own entries
    const { data: existingEntry } = await supabase
      .from('content_calendar')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existingEntry || existingEntry.user_id !== user.id) {
      return NextResponse.json({ error: 'Entry not found or access denied' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('content_calendar')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating calendar entry:', error);
      return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
    }

    return NextResponse.json({ entry: data });
  } catch (error: any) {
    console.error('Calendar PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/content/calendar?id=<entry_id> - Delete calendar entry
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const reset = searchParams.get('reset');

    // Handle full reset (admin only)
    if (reset === 'all') {
      return await handleFullReset(request);
    }

    // Handle single entry deletion
    const user = await getUserFromAuthHeader(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Entry ID required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Ensure user can only delete their own entries
    const { data: existingEntry } = await supabase
      .from('content_calendar')
      .select('user_id, title')
      .eq('id', id)
      .single();

    if (!existingEntry || existingEntry.user_id !== user.id) {
      return NextResponse.json({ error: 'Entry not found or access denied' }, { status: 404 });
    }

    const { error } = await supabase
      .from('content_calendar')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting calendar entry:', error);
      return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
    }

    console.log(`User ${user.id} deleted calendar entry: ${existingEntry.title}`);
    return NextResponse.json({ success: true, message: 'Entry deleted successfully' });
  } catch (error: any) {
    console.error('Calendar DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Handle full reset of all calendar data (admin only)
async function handleFullReset(request: Request) {
  try {
    // Verify admin status
    const user = await getUserFromAuthHeader(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = getServiceClient();

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get count before deletion
    const { count: beforeCount } = await supabase
      .from('content_calendar')
      .select('*', { count: 'exact', head: true });

    // Delete all calendar entries
    const { error } = await supabase
      .from('content_calendar')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using a non-existent UUID)

    if (error) {
      console.error('Error resetting calendar:', error);
      return NextResponse.json({ error: 'Failed to reset calendar' }, { status: 500 });
    }

    console.log(`Admin ${user.id} reset calendar: deleted ${beforeCount || 0} entries`);
    return NextResponse.json({
      success: true,
      message: `Calendar reset successfully. Deleted ${beforeCount || 0} entries.`,
      deleted_count: beforeCount || 0
    });
  } catch (error: any) {
    console.error('Calendar reset error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

