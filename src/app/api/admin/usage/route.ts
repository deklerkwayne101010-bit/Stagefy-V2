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

export async function GET(request: Request) {
  try {
    // Require authentication
    const authUser = await getUserFromAuthHeader(request)
    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminClient = getAdminClient() || createClient(supabaseUrl, supabaseAnonKey)
    const { data: userProfile } = await (adminClient.from as any)('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get all users with their current credit balance (paginated — Supabase caps selects at 1000 rows)
    let users: any[] = []
    let usersError: any = null
    const PAGE = 1000
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

    // Calculate date ranges (computed in UTC so they align with stored timestamptz values)
    const now = new Date()
    const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const firstDayOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
    const lastDayOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999))

    const thisMonthStart = startDate || firstDayOfMonth.toISOString()
    const thisMonthEnd = endDate || now.toISOString()
    const lastMonthStart = firstDayOfLastMonth.toISOString()
    const lastMonthEnd = lastDayOfLastMonth.toISOString()

    // Get ALL credit transactions (paginated — Supabase caps un-paginated selects at 1000 rows)
    let transactions: any[] = []
    let txError: any = null
    const PAGE = 1000
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

    // Calculate per-user usage stats
    const userStats = (users || []).map((user: any) => {
      const userTx = transactions?.filter((tx: any) => tx.user_id === user.id) || []

      // Credits purchased (all time, filtered by date if specified)
      const purchased = userTx
        .filter((tx: any) => 
          (tx.type === 'purchase' || tx.type === 'subscription') && 
          (!startDate || !endDate || 
            (new Date(tx.created_at) >= new Date(startDate) && 
              new Date(tx.created_at) <= new Date(endDate)))
        )
        .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0)

      // Credits spent this month
      const spentThisMonth = userTx
        .filter((tx: any) => 
          tx.type === 'usage' && 
          new Date(tx.created_at) >= new Date(thisMonthStart) &&
          new Date(tx.created_at) <= new Date(thisMonthEnd)
        )
        .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0)

      // Credits spent last month
      const spentLastMonth = userTx
        .filter((tx: any) => 
          tx.type === 'usage' && 
          new Date(tx.created_at) >= new Date(lastMonthStart) &&
          new Date(tx.created_at) <= new Date(lastMonthEnd)
        )
        .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0)

      // Total spent (all time)
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

    // Calculate totals
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
