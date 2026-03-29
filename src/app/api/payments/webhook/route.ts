// PayFast webhook handler for static payment buttons
import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import crypto from 'crypto'

const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || ''

// Validate PayFast ITN signature
function validateSignature(data: Record<string, string>): boolean {
  if (!data.signature) {
    // No signature present - skip validation (common with sandbox static buttons)
    console.log('No signature in ITN, skipping validation')
    return true
  }

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

  const isValid = generatedSig === data.signature
  if (!isValid) {
    console.log('Signature mismatch. Expected:', generatedSig, 'Got:', data.signature)
  }
  return isValid
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
    let userId = data.custom_str1  // User ID passed from the form
    const creditsAmount = parseInt(data.custom_str2 || '0')  // Credits to add
    const pfPaymentId = data.pf_payment_id
    const payerEmail = data.email_address  // Buyer's email

    const supabase = getAdminClient()
    if (!supabase) {
      console.error('Supabase admin client not configured')
      return new NextResponse('Server error', { status: 500 })
    }

    // If userId is empty, try to find user by email
    if (!userId && payerEmail) {
      console.log(`No userId in custom_str1, looking up by email: ${payerEmail}`)
      const { data: userByEmail } = await (supabase.from as any)('users')
        .select('id')
        .eq('email', payerEmail)
        .maybeSingle()

      if (userByEmail) {
        userId = userByEmail.id
        console.log(`Found user by email: ${userId}`)
      }
    }

    if (!userId) {
      console.error('No user ID in payment data and could not find by email')
      return new NextResponse('Missing user ID', { status: 400 })
    }

    // Idempotency check - prevent duplicate credit additions
    if (pfPaymentId) {
      const { data: existingTx } = await (supabase.from as any)('credit_transactions')
        .select('id')
        .eq('reference_id', pfPaymentId)
        .maybeSingle()

      if (existingTx) {
        console.log(`Duplicate ITN received for payment ${pfPaymentId}, skipping`)
        return new NextResponse('Duplicate payment', { status: 200 })
      }
    }

    if (paymentStatus === 'COMPLETE') {
      // Add credits to user account
      const { data: user } = await (supabase.from as any)('users')
        .select('credits')
        .eq('id', userId)
        .single()

      if (!user) {
        console.error(`User not found: ${userId}`)
        return new NextResponse('User not found', { status: 400 })
      }

      const currentCredits = user.credits || 0
      const newCredits = currentCredits + creditsAmount

      const { error: updateError } = await (supabase.from as any)('users')
        .update({ credits: newCredits })
        .eq('id', userId)

      if (updateError) {
        console.error('Failed to update credits:', updateError)
        return new NextResponse('Failed to update credits', { status: 500 })
      }

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

      console.log(`SUCCESS: Added ${creditsAmount} credits to user ${userId}. Balance: ${currentCredits} -> ${newCredits}`)
      return new NextResponse('Payment processed', { status: 200 })
    }

    if (paymentStatus === 'CANCELLED') {
      console.log(`Payment cancelled for user ${userId}`)
      return new NextResponse('Payment cancelled', { status: 200 })
    }

    console.log(`Unhandled payment status: ${paymentStatus}`)
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
