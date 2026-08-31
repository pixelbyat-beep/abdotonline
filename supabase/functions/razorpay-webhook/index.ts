// Verifies a Razorpay payment and marks the order paid. Supports two callers:
//
// 1. The storefront's own checkout success handler (Checkout.tsx) posts
//    { razorpayOrderId, razorpayPaymentId, razorpaySignature } right after Razorpay
//    Checkout.js reports success. The signature can only be produced by Razorpay
//    for a genuinely completed payment, so verifying it server-side here is exactly
//    as secure as a registered webhook — this is Razorpay's own documented
//    "Standard Checkout" server verification flow.
// 2. A real Razorpay webhook (Settings -> Webhooks in the Razorpay dashboard,
//    pointing at this function's URL) as a reliability fallback, verified instead
//    via the X-Razorpay-Signature header and RAZORPAY_WEBHOOK_SECRET. Optional —
//    only needed if you want payment confirmation to keep working even if the
//    customer closes their browser tab before the client-side call above fires.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { sendLicenseKeyEmail, sendOrderConfirmationEmail } from '../_shared/email.ts'

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function markOrderPaid(admin: ReturnType<typeof supabaseAdmin>, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
  const { data: payment } = await admin.from('payments').select('*, orders(*)').eq('razorpay_order_id', razorpayOrderId).single()
  if (!payment) return { error: 'Order not found for this payment' }

  const order = payment.orders
  if (order.payment_status === 'paid') return { order, alreadyProcessed: true }

  await admin
    .from('payments')
    .update({ razorpay_payment_id: razorpayPaymentId, razorpay_signature: razorpaySignature, status: 'paid' })
    .eq('id', payment.id)

  const newOrderStatus = order.delivery_type === 'email' ? 'delivered' : 'processing'
  await admin.from('orders').update({ payment_status: 'paid', order_status: newOrderStatus }).eq('id', order.id)

  if (order.coupon_code) {
    const { data: coupon } = await admin.from('coupons').select('id, used_count').eq('code', order.coupon_code).single()
    if (coupon) await admin.from('coupons').update({ used_count: coupon.used_count + 1 }).eq('id', coupon.id)
  }

  const { data: items } = await admin.from('order_items').select('*').eq('order_id', order.id)

  if (order.delivery_type === 'email' && items) {
    for (const item of items) {
      const { data: key } = await admin
        .from('license_keys')
        .select('id')
        .eq('product_id', item.product_id)
        .eq('status', 'unused')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (key) {
        await admin.from('license_keys').update({ status: 'used', order_id: order.id, used_at: new Date().toISOString() }).eq('id', key.id)
        await admin.from('order_items').update({ license_key_id: key.id }).eq('id', item.id)
      }
    }

    const { data: itemsWithKeys } = await admin.from('order_items').select('*, license_keys(key_value)').eq('order_id', order.id)
    await sendLicenseKeyEmail(admin, order, itemsWithKeys ?? [])
  } else {
    await sendOrderConfirmationEmail(admin, order)
  }

  return { order }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const admin = supabaseAdmin()
    const rawBody = await req.text()
    const razorpaySignatureHeader = req.headers.get('x-razorpay-signature')

    if (razorpaySignatureHeader) {
      // Real Razorpay webhook
      const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
      if (!webhookSecret) return jsonResponse({ error: 'Webhook secret not configured' }, 500)

      const expected = await hmacHex(webhookSecret, rawBody)
      if (expected !== razorpaySignatureHeader) return jsonResponse({ error: 'Invalid webhook signature' }, 400)

      const event = JSON.parse(rawBody)
      if (event.event !== 'payment.captured') return jsonResponse({ ok: true, ignored: true })

      const payment = event.payload.payment.entity
      const result = await markOrderPaid(admin, payment.order_id, payment.id, razorpaySignatureHeader)
      if ('error' in result) return jsonResponse(result, 404)
      return jsonResponse({ ok: true })
    }

    // Direct client-triggered verification (Checkout.tsx success handler)
    const body = JSON.parse(rawBody)
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return jsonResponse({ error: 'Missing payment verification fields' }, 400)
    }

    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!keySecret) return jsonResponse({ error: 'Payment gateway not configured' }, 500)

    const expectedSignature = await hmacHex(keySecret, `${razorpayOrderId}|${razorpayPaymentId}`)
    if (expectedSignature !== razorpaySignature) {
      return jsonResponse({ error: 'Payment signature verification failed' }, 400)
    }

    const result = await markOrderPaid(admin, razorpayOrderId, razorpayPaymentId, razorpaySignature)
    if ('error' in result) return jsonResponse(result, 404)
    return jsonResponse({ ok: true, orderNumber: result.order.order_number })
  } catch (e) {
    console.error(e)
    return jsonResponse({ error: 'Unexpected error verifying payment' }, 500)
  }
})
