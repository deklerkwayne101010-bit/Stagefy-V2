// Shop Orders API
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminClient } from '@/lib/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const client = createClient(supabaseUrl, supabaseAnonKey)
    
    const { data: { user }, error: authError } = await client.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { data: userProfile } = await client
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = userProfile?.role === 'admin'
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('id')
    const status = searchParams.get('status')

    const adminClient = getAdminClient()
    
    let query = adminClient
      .from('shop_orders')
      .select('*, shop_products(*)')
      .order('created_at', { ascending: false })

    if (!isAdmin) {
      query = query.eq('user_id', user.id)
    }

    if (orderId) {
      query = query.eq('id', orderId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    return NextResponse.json({ orders: orders || [] })
  } catch (error) {
    console.error('Shop orders GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
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
      return NextResponse.json({ error: 'Please login to place an order' }, { status: 401 })
    }

    const body = await request.json()
    const { product_id, quantity, customer_email, customer_name, notes } = body

    if (!product_id || !quantity || !customer_email || !customer_name) {
      return NextResponse.json(
        { error: 'Product, quantity, email, and name are required' },
        { status: 400 }
      )
    }

    const adminClient = getAdminClient()
    
    const { data: product, error: productError } = await adminClient
      .from('shop_products')
      .select('*')
      .eq('id', product_id)
      .eq('status', 'active')
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found or unavailable' }, { status: 404 })
    }

    const totalAmount = product.sale_price 
      ? product.sale_price * quantity 
      : product.price * quantity

    const { data: order, error } = await adminClient
      .from('shop_orders')
      .insert({
        user_id: user.id,
        product_id,
        quantity,
        total_amount: totalAmount,
        status: 'pending',
        payment_method: 'payfast',
        customer_email,
        customer_name,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating order:', error)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    return NextResponse.json({ order, product, totalAmount })
  } catch (error) {
    console.error('Shop orders POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const client = createClient(supabaseUrl, supabaseAnonKey)
    
    const { data: { user }, error: authError } = await client.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { data: userProfile } = await client
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status, payfast_payment_id, notes } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 })
    }

    const adminClient = getAdminClient()
    
    const { data: order, error: orderError } = await adminClient
      .from('shop_orders')
      .select('*, shop_products(*)')
      .eq('id', id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (payfast_payment_id) {
      updates.payfast_payment_id = payfast_payment_id
    }

    if (notes !== undefined) {
      updates.notes = notes
    }

    if (status === 'paid' && order.shop_products?.credits_included) {
      const { data: userCredits } = await adminClient
        .from('users')
        .select('credits')
        .eq('id', order.user_id)
        .single()

      if (userCredits) {
        await adminClient
          .from('users')
          .update({ 
            credits: userCredits.credits + (order.shop_products.credits_included * order.quantity) 
          })
          .eq('id', order.user_id)
      }

      await adminClient
        .from('credit_transactions')
        .insert({
          user_id: order.user_id,
          amount: order.shop_products.credits_included * order.quantity,
          type: 'purchase',
          description: `Shop purchase - ${order.shop_products.name}`,
        })
    }

    const { data: updatedOrder, error } = await adminClient
      .from('shop_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating order:', error)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error('Shop orders PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
