// PayFast payment integration for Stagefy
import crypto from 'crypto'

// PayFast configuration
const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || ''
const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || ''
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || ''
const PAYFAST_ENVIRONMENT = process.env.PAYFAST_ENVIRONMENT || 'sandbox' // 'sandbox' or 'live'

const PAYFAST_URLS = {
  sandbox: 'https://sandbox.payfast.co.za/eng/process',
  live: 'https://www.payfast.co.za/eng/process',
}

const PAYFAST_VALIDATION_URLS = {
  sandbox: 'https://sandbox.payfast.co.za/eng/query/validate',
  live: 'https://www.payfast.co.za/eng/query/validate',
}

const PAYFAST_REPORT_URLS = {
  sandbox: 'https://sandbox.payfast.co.za/eng/query/paymentreport',
  live: 'https://www.payfast.co.za/eng/query/paymentreport',
}

// Subscription plans configuration (prices in ZAR)
export const SUBSCRIPTION_PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 520,
    monthlyCredits: 200,
    description: 'Perfect for individual agents',
    features: [
      '200 credits per month',
      'Photo editing',
      'Video generation',
      'Template creation',
      'CRM basic features',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 1420,
    monthlyCredits: 500,
    description: 'For growing teams',
    features: [
      '500 credits per month',
      'Photo editing',
      'Video generation',
      'Template creation',
      'Full CRM access',
      'Priority support',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 3580,
    monthlyCredits: 1500,
    description: 'For large brokerages',
    features: [
      '1,500 credits per month',
      'Photo editing',
      'Video generation',
      'Template creation',
      'Full CRM access',
      'Dedicated support',
      'Custom integrations',
    ],
  },
}

// Credit packages for one-time purchases (prices in ZAR, R1.75 per credit)
export const CREDIT_PACKAGES = [
  { id: '50_credits', name: '50 Credits', price: 87.50, credits: 50 },
  { id: '100_credits', name: '100 Credits', price: 175, credits: 100 },
  { id: '250_credits', name: '250 Credits', price: 437.50, credits: 250 },
  { id: '500_credits', name: '500 Credits', price: 875, credits: 500 },
]

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS

// Generate PayFast payment signature
function generateSignature(data: Record<string, string>, passPhrase?: string): string {
  const sortedKeys = Object.keys(data).sort()
  
  const signatureString = sortedKeys
    .map((key) => `${key}=${encodeURIComponent(data[key])}`)
    .join('&')

  const signaturePayload = passPhrase 
    ? `${passPhrase}&${signatureString}`
    : signatureString

  return crypto
    .createHash('md5')
    .update(signaturePayload)
    .digest('hex')
}

// Create a credit purchase payment
export async function createCreditPayment(
  userId: string,
  packageId: string,
  userEmail: string,
  userName: string
): Promise<{ success: boolean; paymentUrl?: string; error?: string }> {
  const creditPackage = CREDIT_PACKAGES.find((p) => p.id === packageId)
  
  if (!creditPackage) {
    return { success: false, error: 'Invalid credit package' }
  }

  const paymentData: Record<string, string> = {
    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?type=credits&package=${packageId}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancelled`,
    notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
    item_name: `Stagefy - ${creditPackage.name}`,
    item_description: `${creditPackage.credits} credits for your Stagefy account`,
    amount: creditPackage.price.toFixed(2),
    email_address: userEmail,
    name_first: userName.split(' ')[0],
    name_last: userName.split(' ').slice(1).join(' ') || '',
    custom_int1: userId, // Pass user ID for webhook processing
    custom_str1: 'credit_purchase',
  }

  // Generate signature
  const signature = generateSignature(paymentData, PAYFAST_PASSPHRASE)
  paymentData.signature = signature

  // Build payment URL
  const paymentUrl = `${PAYFAST_URLS[PAYFAST_ENVIRONMENT as keyof typeof PAYFAST_URLS]}?${new URLSearchParams(paymentData).toString()}`

  return { success: true, paymentUrl }
}

// Create a subscription payment
export async function createSubscriptionPayment(
  userId: string,
  planId: SubscriptionPlanId,
  userEmail: string,
  userName: string
): Promise<{ success: boolean; paymentUrl?: string; error?: string }> {
  const plan = SUBSCRIPTION_PLANS[planId]
  
  if (!plan) {
    return { success: false, error: 'Invalid subscription plan' }
  }

  const paymentData: Record<string, string> = {
    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?type=subscription&plan=${planId}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancelled`,
    notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
    item_name: `Stagefy ${plan.name} Subscription`,
    item_description: `${plan.monthlyCredits} credits per month - billed monthly`,
    amount: plan.price.toFixed(2),
    email_address: userEmail,
    name_first: userName.split(' ')[0],
    name_last: userName.split(' ').slice(1).join(' ') || '',
    custom_int1: userId,
    custom_str1: 'subscription',
    custom_str2: planId,
    // Subscription fields
    subscription_type: '1', // Ongoing subscription
    subscription_day: '1', // Billing day
    subscription_frequency: '1', // Monthly
    subscription_cycle: '0', // Until cancelled
  }

  // Generate signature
  const signature = generateSignature(paymentData, PAYFAST_PASSPHRASE)
  paymentData.signature = signature

  // Build payment URL
  const paymentUrl = `${PAYFAST_URLS[PAYFAST_ENVIRONMENT as keyof typeof PAYFAST_URLS]}?${new URLSearchParams(paymentData).toString()}`

  return { success: true, paymentUrl }
}

// Cancel a subscription
export async function cancelSubscription(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  // In production, this would call PayFast API to cancel
  // For now, we'll update the local subscription status
  
  const { supabase } = await import('./supabase')
  const { error } = await (supabase.from as any)('subscriptions')
    .update({ 
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Pause user access due to failed payment
export async function pauseUserAccess(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { supabase } = await import('./supabase')
  
  // Set subscription status to past_due and clear credits
  const { error } = await (supabase.from as any)('users')
    .update({
      subscription_tier: 'free',
      credits: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Create notification for user
  await (supabase.from as any)('notifications')
    .insert({
      user_id: userId,
      type: 'payment_failed',
      title: 'Payment Failed',
      message: 'Your subscription payment failed. Please update your payment method to continue using AI features.',
      action_url: '/billing',
    })

  return { success: true }
}

// Reactivate user after successful payment
export async function reactivateUser(
  userId: string,
  subscriptionTier: string,
  credits: number
): Promise<{ success: boolean; error?: string }> {
  const { supabase } = await import('./supabase')
  
  const { error } = await (supabase.from as any)('users')
    .update({
      subscriptionTier,
      credits,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Create notification
  await (supabase.from as any)('notifications')
    .insert({
      user_id: userId,
      type: 'payment_success',
      title: 'Payment Successful',
      message: 'Your payment was processed successfully. Your account has been reactivated.',
    })

  return { success: true }
}

// Validate PayFast payment response
export function validatePayment(
  data: Record<string, string>
): { valid: boolean; message: string } {
  const receivedSignature = data.signature
  delete data.signature

  const calculatedSignature = generateSignature(data, PAYFAST_PASSPHRASE)

  if (receivedSignature !== calculatedSignature) {
    return { valid: false, message: 'Signature mismatch' }
  }

  // Check payment status
  if (data.payment_status === 'FAILED') {
    return { valid: false, message: 'Payment failed' }
  }

  if (data.payment_status === 'USER_CANCELLED') {
    return { valid: false, message: 'Payment cancelled by user' }
  }

  return { valid: true, message: 'Payment validated' }
}
