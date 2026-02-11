// CRM Tasks API Route
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const contactId = searchParams.get('contact_id')
    const listingId = searchParams.get('listing_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get current user
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Build query
    let query = supabase
      .from('crm_tasks')
      .select(`
        *,
        contacts:crm_contacts(id, name, email, phone),
        listings:crm_listings(id, address, city)
      `)
      .eq('user_id', user.id)
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }
    if (contactId) {
      query = query.eq('contact_id', contactId)
    }
    if (listingId) {
      query = query.eq('listing_id', listingId)
    }

    const { data: tasks, error } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      )
    }

    // Get task counts for dashboard
    const { count: pendingCount } = await supabase
      .from('crm_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'pending')

    const { count: overdueCount } = await supabase
      .from('crm_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString())

    return NextResponse.json({
      tasks: tasks || [],
      stats: {
        pending: pendingCount || 0,
        overdue: overdueCount || 0,
      },
    })
  } catch (error) {
    console.error('Tasks API error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      task_type,
      priority,
      status,
      due_date,
      contact_id,
      listing_id,
      reminder,
    } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Get current user
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Insert task
    const { data: task, error } = await supabase
      .from('crm_tasks')
      .insert({
        user_id: user.id,
        title,
        description,
        task_type: task_type || 'follow-up',
        priority: priority || 'medium',
        status: status || 'pending',
        due_date: due_date || null,
        contact_id: contact_id || null,
        listing_id: listing_id || null,
        reminder: reminder || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating task:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create task' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.from('crm_activities').insert({
      user_id: user.id,
      contact_id: contact_id || null,
      listing_id: listing_id || null,
      activity_type: 'note',
      content: `Task created: ${title}`,
      direction: 'internal',
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating task' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    // Get current user
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Update task
    const { data: task, error } = await supabase
      .from('crm_tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        ...(updates.status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating task:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update task' },
        { status: 500 }
      )
    }

    // Log activity if status changed
    if (updates.status === 'completed') {
      await supabase.from('crm_activities').insert({
        user_id: user.id,
        contact_id: task.contact_id || null,
        listing_id: task.listing_id || null,
        activity_type: 'note',
        content: `Task completed: ${task.title}`,
        direction: 'internal',
      })
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Update task error:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating task' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    // Get current user
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Delete task
    const { error } = await supabase
      .from('crm_tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting task:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to delete task' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete task error:', error)
    return NextResponse.json(
      { error: 'An error occurred while deleting task' },
      { status: 500 }
    )
  }
}
