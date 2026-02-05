#!/usr/bin/env node

/**
 * Monthly Credit Reset Script
 * 
 * This script resets credits for all active subscriptions.
 * Run this monthly via GitHub Actions or Vercel Cron.
 * 
 * Usage: node scripts/reset-monthly-credits.js
 */

const { createClient } = require('@supabase/supabase-js')

// Supabase client with service role key (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Subscription plans with monthly credit allocations
const SUBSCRIPTION_PLANS = {
  basic: { monthlyCredits: 50 },
  pro: { monthlyCredits: 150 },
  enterprise: { monthlyCredits: 300 },
}

async function resetMonthlyCredits() {
  console.log('Starting monthly credit reset...')
  
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
      return
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
        const { error: transError } = await supabase
          .from('credit_transactions')
          .insert({
            user_id: subscription.user_id,
            amount: plan.monthlyCredits,
            type: 'subscription',
            description: `Monthly credit reset - ${subscription.plan_id} plan`,
          })
        
        if (transError) {
          console.warn(`Failed to log transaction for user ${subscription.user_id}: ${transError.message}`)
        }
        
        // Create notification
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: subscription.user_id,
            type: 'subscription_renewal',
            title: 'Credits Reset',
            message: `Your ${plan.monthlyCredits} monthly credits have been added to your account.`,
          })
        
        if (notifError) {
          console.warn(`Failed to create notification for user ${subscription.user_id}: ${notifError.message}`)
        }
        
        console.log(`✓ Reset ${plan.monthlyCredits} credits for user ${subscription.user_id}`)
        successCount++
        
      } catch (err) {
        console.error(`✗ Failed to reset credits for subscription ${subscription.id}: ${err.message}`)
        errorCount++
      }
    }
    
    console.log(`\nMonthly credit reset complete!`)
    console.log(`Success: ${successCount}`)
    console.log(`Errors: ${errorCount}`)
    
    if (errorCount > 0) {
      process.exit(1)
    }
    
  } catch (err) {
    console.error('Fatal error during credit reset:', err)
    process.exit(1)
  }
}

// Run the reset
resetMonthlyCredits()
