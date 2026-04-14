// PayFast Payment API
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminClient } from '@/lib/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface ShopOrder {
  id: string
  status: string
  total_amount: number
  shop_products: { name: string; description: string } | null
}

const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || '10028813'
const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || '4j9g7b8c8k44c'
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || ''
const PAYFAST_MODE = process.env.PAYFAST_MODE || 'sandbox'
const PAYFAST_BASE_URL = PAYFAST_MODE === 'live' 
  ? 'https://www.payfast.co.za' 
  : 'https://sandbox.payfast.co.za'

function generateSignature(data: Record<string, string>, passphrase: string): string {
  const pfParams = Object.keys(data)
    .filter(key => key.startsWith('pf_'))
    .sort()
    .map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
    .join('&')
  
  const passStr = passphrase ? `${pfParams}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}` : pfParams
  
  return require('crypto').createHash('md5').update(passStr).digest('hex')
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const client = createClient(supabaseUrl, supabaseAnonKey)
    
    const { data: { user }, error: authError } = await client.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Please login to make a payment' }, { status: 401 })
    }

    const body = await request.json()
    const { order_id } = body

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const adminClient = getAdminClient()
    if (!adminClient) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }
    
    const { data: order, error: orderError } = await adminClient
      .from('shop_orders')
      .select('*, shop_products(*)')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single() as { data: ShopOrder | null; error: Error | null }

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status === 'paid' || order.status === 'completed') {
      return NextResponse.json({ error: 'Order already paid' }, { status: 400 })
    }

    const { data: userProfile } = await client
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/shop/payment/success`
    const cancelUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/shop/payment/cancelled`
    const notifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/shop/payment/notify`

    const pfData: Record<string, string> = {
      merchant_id: PAYFAST_MERCHANT_ID,
      merchant_key: PAYFAST_MERCHANT_KEY,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      name_first: userProfile?.full_name?.split(' ')[0] || 'Customer',
      name_last: userProfile?.full_name?.split(' ').slice(1).join(' ') || '',
      email_address: userProfile?.email || user.email || '',
      m_payment_id: order.id,
      amount: order.total_amount.toFixed(2),
      item_name: order.shop_products?.name || 'Shop Item',
      item_description: order.shop_products?.description || '',
      custom_str1: order.id,
    }

    pfData.signature = generateSignature(pfData, PAYFAST_PASSPHRASE)

    const paymentUrl = `${PAYFAST_BASE_URL}/eng/process`

    return NextResponse.json({
      paymentUrl,
      paymentData: pfData,
      orderId: order.id,
    })
  } catch (error) {
    console.error('PayFast payment POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
