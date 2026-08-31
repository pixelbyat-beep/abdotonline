import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts'

interface RequestBody {
  guest: { name: string; email: string; phone: string }
  userId: string | null
  deliveryType: 'email' | 'courier'
  paymentMethod: 'online' | 'cod'
  address: { addressLine: string; city: string; state: string; pincode: string } | null
  items: { productId: string; qty: number }[]
  couponCode: string | null
}

function randomOrderNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)]
  return `ABD-${suffix}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body: RequestBody = await req.json()
    const admin = supabaseAdmin()

    if (!body.guest?.email || !body.items?.length) {
      return jsonResponse({ error: 'Missing required fields' }, 400)
    }

    // Server-side price lookup — never trust client-sent prices
    const productIds = body.items.map((i) => i.productId)
    const { data: products, error: productsError } = await admin
      .from('products')
      .select('id, name, price, delivery_type, stock_qty')
      .in('id', productIds)
      .eq('status', 'active')

    if (productsError || !products || products.length !== productIds.length) {
      return jsonResponse({ error: 'One or more products are unavailable' }, 400)
    }

    let subtotal = 0
    const orderItemsInput = body.items.map((item) => {
      const product = products.find((p: { id: string; price: number }) => p.id === item.productId)!
      subtotal += Number(product.price) * item.qty
      return { productId: item.productId, qty: item.qty, price: Number(product.price), name: product.name }
    })

    // Coupon (re-validated server-side; never trust client discount amount)
    let discountAmount = 0
    let couponCode: string | null = null
    if (body.couponCode) {
      const { data: coupon } = await admin.from('coupons').select('*').ilike('code', body.couponCode).eq('status', 'active').single()
      if (coupon) {
        const notExpired = !coupon.expires_at || new Date(coupon.expires_at) > new Date()
        const underLimit = !coupon.max_uses || coupon.used_count < coupon.max_uses
        const meetsMin = subtotal >= Number(coupon.min_order)
        if (notExpired && underLimit && meetsMin) {
          discountAmount = coupon.type === 'percent' ? Math.round((subtotal * Number(coupon.value)) / 100) : Math.min(Number(coupon.value), subtotal)
          couponCode = coupon.code
        }
      }
    }

    // Delivery charge — always from settings, never hardcoded
    const { data: settingsRows } = await admin
      .from('settings')
      .select('key, value')
      .in('key', ['delivery_charge_courier', 'delivery_charge_free_above', 'delivery_email_charge', 'cod_extra_charge'])
    const settings = Object.fromEntries((settingsRows ?? []).map((r: { key: string; value: string }) => [r.key, Number(r.value)]))

    const afterDiscount = subtotal - discountAmount
    let deliveryCharge = 0
    if (body.deliveryType === 'email') {
      deliveryCharge = settings.delivery_email_charge ?? 0
    } else {
      deliveryCharge = afterDiscount >= (settings.delivery_charge_free_above ?? 999) ? 0 : (settings.delivery_charge_courier ?? 99)
    }
    const codCharge = body.paymentMethod === 'cod' ? settings.cod_extra_charge ?? 0 : 0
    const total = afterDiscount + deliveryCharge + codCharge

    // Unique order number (retry on rare collision)
    let orderNumber = randomOrderNumber()
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: existing } = await admin.from('orders').select('id').eq('order_number', orderNumber).maybeSingle()
      if (!existing) break
      orderNumber = randomOrderNumber()
    }

    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: body.userId,
        guest_name: body.guest.name,
        guest_email: body.guest.email,
        guest_phone: body.guest.phone,
        subtotal,
        delivery_charge: deliveryCharge,
        discount_amount: discountAmount,
        coupon_code: couponCode,
        total,
        payment_status: 'pending',
        payment_method: body.paymentMethod,
        delivery_type: body.deliveryType,
        address_line: body.address?.addressLine ?? null,
        city: body.address?.city ?? null,
        state: body.address?.state ?? null,
        pincode: body.address?.pincode ?? null,
        order_status: body.paymentMethod === 'cod' ? 'processing' : 'pending',
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error(orderError)
      return jsonResponse({ error: 'Could not create order' }, 500)
    }

    const { error: itemsError } = await admin.from('order_items').insert(
      orderItemsInput.map((i) => ({
        order_id: order.id,
        product_id: i.productId,
        qty: i.qty,
        price: i.price,
        product_name_snapshot: i.name,
      })),
    )
    if (itemsError) {
      console.error(itemsError)
      return jsonResponse({ error: 'Could not create order items' }, 500)
    }

    if (body.paymentMethod === 'cod') {
      return jsonResponse({ orderId: order.id, orderNumber: order.order_number })
    }

    // Create Razorpay order
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!keyId || !keySecret) {
      return jsonResponse({ error: 'Payment gateway not configured. Please contact support.' }, 500)
    }

    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: Math.round(total * 100), currency: 'INR', receipt: order.order_number }),
    })

    if (!razorpayRes.ok) {
      console.error(await razorpayRes.text())
      return jsonResponse({ error: 'Could not initiate payment' }, 500)
    }

    const razorpayOrder = await razorpayRes.json()

    await admin.from('payments').insert({
      order_id: order.id,
      razorpay_order_id: razorpayOrder.id,
      amount: total,
      status: 'created',
    })

    return jsonResponse({
      orderId: order.id,
      orderNumber: order.order_number,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      keyId,
    })
  } catch (e) {
    console.error(e)
    return jsonResponse({ error: 'Unexpected error creating order' }, 500)
  }
})
