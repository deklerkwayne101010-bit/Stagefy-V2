// Monthly Credit Reset API Route
// This endpoint is called by Vercel Cron on the 1st of each month

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Only allow cron requests with authorization header
const CRON_SECRET = process.env.CRON_SECRET || ''

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Subscription plans with monthly credit allocations
const SUBSCRIPTION_PLANS: Record<string, { monthlyCredits: number }> = {
  basic: { monthlyCredits: 50 },
  pro: { monthlyCredits: 150 },
  enterprise: { monthlyCredits: 300 },
}

export async function GET(request: Request) {
  // Verify cron authorization
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  console.log('Starting monthly credit reset via Vercel Cron...')

  try {
    // Get all active subscriptions
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('id, user_id, plan_id, status')
      .eq('status', 'active')

    if (error) {
      throw new Error(`Failed to fetch subscriptions: ${error.message}`)
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No active subscriptions found.')
      return NextResponse.json({ message: 'No active subscriptions', count: 0 })
    }

    console.log(`Found ${subscriptions.length} active subscriptions to reset.`)

    let successCount = 0
    let errorCount = 0

    // Process each subscription
    for (const subscription of subscriptions) {
      const plan = SUBSCRIPTION_PLANS[subscription.plan_id]

      if (!plan) {
        console.warn(`Unknown plan for subscription ${subscription.id}: ${subscription.plan_id}`)
        continue
      }

      try {
        // Reset user credits to monthly allocation
        const { error: updateError } = await supabase
          .from('users')
          .update({
            credits: plan.monthlyCredits,
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.user_id)

        if (updateError) {
          throw updateError
        }

        // Update subscription record
        const { error: subError } = await supabase
          .from('subscriptions')
          .update({
            credits_remaining: plan.monthlyCredits,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id)

        if (subError) {
          throw subError
        }

        // Log transaction
        await supabase.from('credit_transactions').insert({
          user_id: subscription.user_id,
          amount: plan.monthlyCredits,
          type: 'subscription',
          description: `Monthly credit reset - ${subscription.plan_id} plan`,
        })

        // Create notification
        await supabase.from('notifications').insert({
          user_id: subscription.user_id,
          type: 'subscription_renewal',
          title: 'Credits Reset',
          message: `Your ${plan.monthlyCredits} monthly credits have been added to your account.`,
        })

        successCount++

      } catch (err) {
        console.error(`Failed to reset credits for subscription ${subscription.id}:`, err)
        errorCount++
      }
    }

    console.log(`Monthly credit reset complete. Success: ${successCount}, Errors: ${errorCount}`)

    return NextResponse.json({
      message: 'Monthly credit reset complete',
      successCount,
      errorCount,
    })

  } catch (err) {
    console.error('Fatal error during credit reset:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
