// PayFast webhook handler for static payment buttons
import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import crypto from 'crypto'

const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || ''

// Validate PayFast ITN signature
function validateSignature(data: Record<string, string>): boolean {
  // Build signature string (sorted keys, URL encoded)
  const sortedKeys = Object.keys(data)
    .filter(k => k !== 'signature')
    .sort()

  const sigString = sortedKeys
    .map(k => `${k}=${encodeURIComponent(data[k])}`)
    .join('&')

  const sigWithPassphrase = PAYFAST_PASSPHRASE
    ? `${sigString}&passphrase=${encodeURIComponent(PAYFAST_PASSPHRASE)}`
    : sigString

  const generatedSig = crypto
    .createHash('md5')
    .update(sigWithPassphrase)
    .digest('hex')

  return generatedSig === data.signature
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const data: Record<string, string> = {}

    formData.forEach((value, key) => {
      data[key] = value.toString()
    })

    console.log('PayFast ITN received:', JSON.stringify(data, null, 2))

    // Validate signature
    if (!validateSignature(data)) {
      console.error('PayFast signature validation failed')
      return new NextResponse('Invalid signature', { status: 400 })
    }

    const paymentStatus = data.payment_status
    const userId = data.custom_str1  // User ID passed from the form
    const creditsAmount = parseInt(data.custom_str2 || '0')  // Credits to add
    const pfPaymentId = data.pf_payment_id

    if (!userId) {
      console.error('No user ID in payment data')
      return new NextResponse('Missing user ID', { status: 400 })
    }

    const supabase = getAdminClient()
    if (!supabase) {
      console.error('Supabase admin client not configured')
      return new NextResponse('Server error', { status: 500 })
    }

    if (paymentStatus === 'COMPLETE') {
      // Add credits to user account
      const { data: user } = await (supabase.from as any)('users')
        .select('credits')
        .eq('id', userId)
        .single()

      const currentCredits = user?.credits || 0
      const newCredits = currentCredits + creditsAmount

      await (supabase.from as any)('users')
        .update({ credits: newCredits })
        .eq('id', userId)

      // Log transaction
      await (supabase.from as any)('credit_transactions')
        .insert({
          user_id: userId,
          amount: creditsAmount,
          type: 'purchase',
          description: `Purchased ${creditsAmount} credits`,
          reference_id: pfPaymentId,
        })

      // Create notification
      await (supabase.from as any)('notifications')
        .insert({
          user_id: userId,
          type: 'payment_success',
          title: 'Credits Added',
          message: `${creditsAmount} credits have been added to your account.`,
          action_url: '/billing',
        })

      console.log(`Added ${creditsAmount} credits to user ${userId}. New balance: ${newCredits}`)
      return new NextResponse('Payment processed', { status: 200 })
    }

    if (paymentStatus === 'CANCELLED') {
      console.log(`Payment cancelled for user ${userId}`)
      return new NextResponse('Payment cancelled', { status: 200 })
    }

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
