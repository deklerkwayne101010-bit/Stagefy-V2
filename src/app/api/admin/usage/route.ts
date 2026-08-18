// API route for admin usage statistics
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminClient } from '@/lib/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Helper to get user from Authorization header
async function getUserFromAuthHeader(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.replace('Bearer ', '')
  const client = createClient(supabaseUrl, supabaseAnonKey)
  try {
    const { data: { user }, error } = await client.auth.getUser(token)
    if (error || !user) return null
    return user
  } catch { return null }
}

function mapAgentName(description: string | null): string {
  if (!description) return 'Other'
  const d = description.toLowerCase()
  if (d.includes('photo_edit') || d.includes('photo edit')) return 'Photo Edit'
  if (d.includes('image_to_video') || d.includes('image to video') || d.includes('i2v')) return 'Image to Video'
  if (d.includes('video_editor_simple') || d.includes('video_full_edit') || d.includes('video_trim') || d.includes('video_concat') || d.includes('video_transition') || d.includes('video_text_overlay') || d.includes('video editor')) return 'Video Editor'
  if (d.includes('template_generation') || d.includes('layout_generation') || d.includes('template_render') || d.includes('professional_template') || d.includes('template')) return 'Template Generation'
  if (d.includes('description_generation') || d.includes('description')) return 'Description Generator'
  if (d.includes('content_plan_generation') || d.includes('content plan')) return 'Content Plan'
  if (d.includes('prompt_generation') || d.includes('prompt')) return 'Prompt Generation'
  if (d.includes('reserved for')) {
    const match = description.match(/Reserved for (.+)/)
    if (match) return mapAgentName(match[1])
  }
  if (d.includes('refund for failed')) {
    const match = description.match(/Refund for failed (.+)/)
    if (match) return mapAgentName(match[1])
  }
  return description
}

export async function GET(request: Request) {
  try {
    const authUser = await getUserFromAuthHeader(request)
    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = getAdminClient() || createClient(supabaseUrl, supabaseAnonKey)
    const { data: userProfile } = await (adminClient.from as any)('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (mode === 'history') {
      const PAGE = 1000
      const now = new Date()
      const defaultStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const historyStart = startDate ? new Date(startDate) : defaultStart
      const historyEnd = endDate ? new Date(endDate) : now

      let transactions: any[] = []
      let txError: any = null
      for (let start = 0; start < 100000; start += PAGE) {
        const { data: page, error } = await (adminClient.from as any)('credit_transactions')
          .select('id, user_id, amount, type, description, reference_id, created_at')
          .eq('type', 'usage')
          .gte('created_at', historyStart.toISOString())
          .lte('created_at', historyEnd.toISOString())
          .order('created_at', { ascending: false })
          .range(start, start + PAGE - 1)
        if (error) {
          txError = error
          break
        }
        if (page && page.length > 0) {
          transactions = transactions.concat(page)
        }
        if (!page || page.length < PAGE) {
          break
        }
      }

      if (txError) {
        return NextResponse.json({ error: txError.message }, { status: 500 })
      }

      let authEvents: any[] = []
      let authError: any = null
      for (let start = 0; start < 100000; start += PAGE) {
        const { data: page, error } = await (adminClient.from as any)('auth_events')
          .select('id, user_id, email, event_type, created_at')
          .gte('created_at', historyStart.toISOString())
          .lte('created_at', historyEnd.toISOString())
          .order('created_at', { ascending: false })
          .range(start, start + PAGE - 1)
        if (error) {
          authError = error
          break
        }
        if (page && page.length > 0) {
          authEvents = authEvents.concat(page)
        }
        if (!page || page.length < PAGE) {
          break
        }
      }

      if (authError) {
        console.error('Failed to fetch auth events:', authError)
      }

      const userIds = Array.from(new Set([
        ...transactions.map((t) => t.user_id).filter(Boolean),
        ...authEvents.map((t) => t.user_id).filter(Boolean),
      ]))
      const usersMap = new Map<string, { email: string; full_name: string }>()
      if (userIds.length > 0) {
        for (let start = 0; start < userIds.length; start += PAGE) {
          const batch = userIds.slice(start, start + PAGE)
          const { data, error } = await (adminClient.from as any)('users')
            .select('id, email, full_name')
            .in('id', batch)
          if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
          }
          if (data) {
            for (const u of data) {
              usersMap.set(u.id, { email: u.email, full_name: u.full_name })
            }
          }
        }
      }

      const usageHistory = transactions.map((tx) => {
        const user = usersMap.get(tx.user_id)
        return {
          id: tx.id,
          type: 'usage' as const,
          userId: tx.user_id,
          email: user?.email || 'Unknown',
          fullName: user?.full_name || 'Unknown User',
          agentName: mapAgentName(tx.description),
          creditsSpent: Math.abs(tx.amount || 0),
          timestamp: tx.created_at,
        }
      })

      const authHistory = authEvents.map((ev) => {
        const user = usersMap.get(ev.user_id || '') || { email: ev.email || 'Unknown', full_name: 'Unknown User' }
        return {
          id: ev.id,
          type: ev.event_type as 'signup' | 'login',
          userId: ev.user_id,
          email: user.email,
          fullName: user.full_name,
          agentName: ev.event_type === 'signup' ? 'Signup' : 'Login',
          creditsSpent: 0,
          timestamp: ev.created_at,
        }
      })

      const history = [...usageHistory, ...authHistory].sort((a, b) => {
        const aTime = new Date(a.timestamp).getTime()
        const bTime = new Date(b.timestamp).getTime()
        return bTime - aTime
      })

      return NextResponse.json({ history, count: history.length })
    }

    // Default mode: per-user stats
    const PAGE = 1000
    let users: any[] = []
    let usersError: any = null
    for (let start = 0; start < 100000; start += PAGE) {
      let q = (adminClient.from as any)('users')
        .select('id, email, full_name, credits, subscription_tier, created_at')
        .range(start, start + PAGE - 1)
      if (userId) {
        q = q.eq('id', userId)
      }
      const { data: page, error } = await q
      if (error) {
        usersError = error
        break
      }
      if (page && page.length > 0) {
        users = users.concat(page)
      }
      if (!page || page.length < PAGE) {
        break
      }
    }

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    const now = new Date()
    const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const firstDayOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
    const lastDayOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999))

    const thisMonthStart = startDate || firstDayOfMonth.toISOString()
    const thisMonthEnd = endDate || now.toISOString()
    const lastMonthStart = firstDayOfLastMonth.toISOString()
    const lastMonthEnd = lastDayOfLastMonth.toISOString()

    let transactions: any[] = []
    let txError: any = null
    for (let start = 0; start < 100000; start += PAGE) {
      const { data: page, error } = await (adminClient.from as any)('credit_transactions')
        .select('user_id, amount, type, created_at')
        .range(start, start + PAGE - 1)
      if (error) {
        txError = error
        break
      }
      if (page && page.length > 0) {
        transactions = transactions.concat(page)
      }
      if (!page || page.length < PAGE) {
        break
      }
    }

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 })
    }

    const userStats = (users || []).map((user: any) => {
      const userTx = transactions?.filter((tx: any) => tx.user_id === user.id) || []

      const purchased = userTx
        .filter((tx: any) =>
          (tx.type === 'purchase' || tx.type === 'subscription') &&
          (!startDate || !endDate ||
            (new Date(tx.created_at) >= new Date(startDate) &&
              new Date(tx.created_at) <= new Date(endDate)))
        )
        .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0)

      const spentThisMonth = userTx
        .filter((tx: any) =>
          tx.type === 'usage' &&
          new Date(tx.created_at) >= new Date(thisMonthStart) &&
          new Date(tx.created_at) <= new Date(thisMonthEnd)
        )
        .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0)

      const spentLastMonth = userTx
        .filter((tx: any) =>
          tx.type === 'usage' &&
          new Date(tx.created_at) >= new Date(lastMonthStart) &&
          new Date(tx.created_at) <= new Date(lastMonthEnd)
        )
        .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0)

      const totalSpent = userTx
        .filter((tx: any) => tx.type === 'usage')
        .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0)

      return {
        userId: user.id,
        email: user.email,
        fullName: user.full_name || 'Unknown',
        creditsRemaining: user.credits || 0,
        subscriptionTier: user.subscription_tier || 'free',
        creditsPurchased: purchased,
        creditsSpentThisMonth: spentThisMonth,
        creditsSpentLastMonth: spentLastMonth,
        totalCreditsSpent: totalSpent,
        joinedAt: user.created_at,
      }
    })

    const totals = {
      totalUsers: userStats.length,
      totalCreditsRemaining: userStats.reduce((sum: number, u: any) => sum + u.creditsRemaining, 0),
      totalCreditsPurchased: userStats.reduce((sum: number, u: any) => sum + u.creditsPurchased, 0),
      totalCreditsSpentThisMonth: userStats.reduce((sum: number, u: any) => sum + u.creditsSpentThisMonth, 0),
      totalCreditsSpentLastMonth: userStats.reduce((sum: number, u: any) => sum + u.creditsSpentLastMonth, 0),
    }

    return NextResponse.json({
      users: userStats,
      totals,
      dateRange: {
        thisMonth: { start: thisMonthStart, end: thisMonthEnd },
        lastMonth: { start: lastMonthStart, end: lastMonthEnd },
      },
    })
  } catch (error) {
    console.error('Admin usage stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

