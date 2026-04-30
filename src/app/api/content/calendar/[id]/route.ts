// Dynamic route for individual calendar entry operations
import { NextResponse } from 'next/server'
import { getCurrentUser, supabase } from '@/lib/supabase'

// PATCH update a specific calendar entry
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('content_calendar')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // Build update object with allowed fields
    const updateFields: Record<string, any> = {}
    const allowedFields = [
      'title', 'caption', 'image_url', 'platform', 'scheduled_for',
      'status', 'is_recurring', 'recurrence_rule', 'recurrence_end_date',
      'visual_type'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field.includes('_for') || field.includes('_date')) {
          updateFields[field] = new Date(body[field]).toISOString()
        } else {
          updateFields[field] = body[field]
        }
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('content_calendar')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating calendar entry:', error)
      return NextResponse.json({ error: 'Failed to update calendar entry' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Calendar PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE a specific calendar entry
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership before deleting
    const { data: existing, error: fetchError } = await supabase
      .from('content_calendar')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // Delete the entry
    const { error } = await supabase
      .from('content_calendar')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting calendar entry:', error)
      return NextResponse.json({ error: 'Failed to delete calendar entry' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Entry deleted successfully' })
  } catch (error) {
    console.error('Calendar DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
