// PayFast Payment Notification Webhook
import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import crypto from 'crypto'

const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || ''
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@stagefy.co.za'

function verifySignature(data: Record<string, string>, passphrase: string, signature: string): boolean {
  const pfParams = Object.keys(data)
    .filter(key => key.startsWith('pf_'))
    .sort()
    .map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
    .join('&')
  
  const passStr = passphrase ? `${pfParams}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}` : pfParams
  
  const expectedSignature = crypto.createHash('md5').update(passStr).digest('hex')
  return expectedSignature === signature
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const data: Record<string, string> = {}
    
    for (const [key, value] of formData.entries()) {
      data[key] = value.toString()
    }

    console.log('PayFast notification received:', data)

    const signature = data['signature']
    const paymentStatus = data['payment_status']
    const orderId = data['m_payment_id'] || data['custom_str1']
    const amount = data['amount']
    const merchantId = data['merchant_id']

    if (!orderId) {
      console.error('No order ID in PayFast notification')
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 })
    }

    if (signature && PAYFAST_PASSPHRASE) {
      if (!verifySignature(data, PAYFAST_PASSPHRASE, signature)) {
        console.error('Invalid PayFast signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    const adminClient = getAdminClient()
    if (!adminClient) {
      console.error('Admin client not configured')
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }
    
    const { data: order, error: orderError } = await adminClient
      .from('shop_orders')
      .select('*, shop_products(*)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Order not found:', orderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    let newStatus = order.status
    
    if (paymentStatus === 'COMPLETE') {
      newStatus = 'paid'
    } else if (paymentStatus === 'FAILED') {
      newStatus = 'cancelled'
    }

    await adminClient
      .from('shop_orders')
      .update({
        status: newStatus,
        payfast_payment_id: data['pptx_id'] || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    // Simple purchase in Rand - no credits added

    console.log(`Order ${orderId} status updated to ${newStatus}`)

    // Create notification for admin
    try {
      await adminClient
        .from('notifications')
        .insert({
          user_id: order.user_id,
          type: 'payment_success',
          title: 'New Shop Order',
          message: `Order #${order.id.slice(0, 8)} - R${order.total_amount} from ${order.customer_name} (${order.customer_email}) - Status: ${newStatus}`,
          read: false,
          action_url: '/admin',
        })
      console.log('Admin notification created')
    } catch (notifError) {
      console.error('Failed to create notification:', notifError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PayFast notification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
