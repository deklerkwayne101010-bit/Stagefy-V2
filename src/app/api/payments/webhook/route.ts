// PayFast webhook handler for payment notifications
import { NextResponse } from 'next/server'
import { validatePayment, SUBSCRIPTION_PLANS, CREDIT_PACKAGES, reactivateUser, pauseUserAccess } from '@/lib/payfast'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const data: Record<string, string> = {}
    
    formData.forEach((value, key) => {
      data[key] = value.toString()
    })

    // Validate the payment
    const validation = validatePayment(data)
    
    if (!validation.valid) {
      console.error('Payment validation failed:', validation.message)
      return new NextResponse('Invalid payment', { status: 400 })
    }

    const userId = data.custom_int1
    const paymentType = data.custom_str1 // 'credit_purchase' or 'subscription'
    const paymentStatus = data.payment_status
    const amount = parseFloat(data.amount)

    if (paymentStatus === 'FAILED' || paymentStatus === 'USER_CANCELLED') {
      // Handle failed/cancelled payment - pause AI access
      await pauseUserAccess(userId)
      return new NextResponse('Payment failed processed', { status: 200 })
    }

    if (paymentStatus === 'COMPLETE' || paymentStatus === 'SUCCESS') {
      if (paymentType === 'credit_purchase') {
        // Handle credit purchase
        const packageId = data.custom_str2 || ''
        const creditPackage = CREDIT_PACKAGES.find(p => p.id === packageId)
        
        if (creditPackage) {
          // Add credits to user account
          const { data: user } = await (supabase.from as any)('users')
            .select('credits')
            .eq('id', userId)
            .single()
          
          const currentCredits = user?.credits || 0
          const newCredits = currentCredits + creditPackage.credits

          await (supabase.from as any)('users')
            .update({ credits: newCredits })
            .eq('id', userId)

          // Log transaction
          await (supabase.from as any)('credit_transactions')
            .insert({
              user_id: userId,
              amount: creditPackage.credits,
              type: 'purchase',
              description: `Purchased ${creditPackage.credits} credits`,
              reference_id: data.pf_payment_id,
            })

          // Create notification
          await (supabase.from as any)('notifications')
            .insert({
              user_id: userId,
              type: 'payment_success',
              title: 'Credits Added',
              message: `${creditPackage.credits} credits have been added to your account.`,
              action_url: '/billing',
            })
        }
      } else if (paymentType === 'subscription') {
        // Handle subscription
        const planId = data.custom_str2 as keyof typeof SUBSCRIPTION_PLANS
        const plan = SUBSCRIPTION_PLANS[planId]
        
        if (plan) {
          // Reactivate user with new subscription
          await reactivateUser(userId, planId, plan.monthlyCredits)

          // Create or update subscription record
          const { data: existingSub } = await (supabase.from as any)('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single()

          if (existingSub) {
            await (supabase.from as any)('subscriptions')
              .update({
                plan_id: planId,
                status: 'active',
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                credits_remaining: plan.monthlyCredits,
                monthly_credits: plan.monthlyCredits,
                price_paid: plan.price,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingSub.id)
          } else {
            await (supabase.from as any)('subscriptions')
              .insert({
                user_id: userId,
                plan_id: planId,
                status: 'active',
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                credits_remaining: plan.monthlyCredits,
                monthly_credits: plan.monthlyCredits,
                price_paid: plan.price,
                payfast_subscription_id: data.pf_payment_id,
              })
          }

          // Log transaction
          await (supabase.from as any)('credit_transactions')
            .insert({
              user_id: userId,
              amount: plan.monthlyCredits,
              type: 'subscription',
              description: `${plan.name} subscription activated`,
              reference_id: data.pf_payment_id,
            })

          // Create notification
          await (supabase.from as any)('notifications')
            .insert({
              user_id: userId,
              type: 'payment_success',
              title: 'Subscription Activated',
              message: `Your ${plan.name} subscription is now active with ${plan.monthlyCredits} credits.`,
              action_url: '/billing',
            })
        }
      }

      return new NextResponse('Payment processed successfully', { status: 200 })
    }

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
