// API route for admin usage statistics
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get all users with their current credit balance
    let usersQuery = (supabase.from as any)('users')
      .select('id, email, full_name, credits, subscription_tier, created_at')

    if (userId) {
      usersQuery = usersQuery.eq('id', userId)
    }

    const { data: users, error: usersError } = await usersQuery

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    // Calculate date ranges
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const thisMonthStart = startDate || firstDayOfMonth.toISOString()
    const thisMonthEnd = endDate || now.toISOString()
    const lastMonthStart = firstDayOfLastMonth.toISOString()
    const lastMonthEnd = lastDayOfLastMonth.toISOString()

    // Get all credit transactions for the date ranges
    const { data: transactions, error: txError } = await (supabase.from as any)('credit_transactions')
      .select('user_id, amount, type, created_at')

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
