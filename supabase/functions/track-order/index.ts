// Public order lookup by order_number + email — no login required. This is the
// entire "guest checkout" trust boundary: knowing both values is treated as proof
// of ownership, same as any e-commerce guest order tracking page.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { orderNumber, email } = await req.json()
    if (!orderNumber || !email) return jsonResponse({ found: false, message: 'Order number and email are required' }, 400)

    const admin = supabaseAdmin()
    const { data: order } = await admin
      .from('orders')
      .select('*')
      .ilike('order_number', orderNumber.trim())
      .ilike('guest_email', email.trim())
      .maybeSingle()

    if (!order) {
      return jsonResponse({ found: false, message: 'No order found with that order number and email.' })
    }

    const { data: items } = await admin
      .from('order_items')
      .select('qty, price, product_name_snapshot, license_keys(key_value)')
      .eq('order_id', order.id)

    // Only reveal the key once the admin has actually sent it — payment being
    // captured doesn't mean the key has gone out yet (that's a manual step now).
    const includeKeys = order.payment_status === 'paid' && order.delivery_type === 'email' && !!order.license_key_sent_at

    return jsonResponse({
      found: true,
      orderNumber: order.order_number,
      orderStatus: order.order_status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      deliveryType: order.delivery_type,
      subtotal: Number(order.subtotal),
      deliveryCharge: Number(order.delivery_charge),
      discountAmount: Number(order.discount_amount),
      total: Number(order.total),
      trackingNumber: order.tracking_number,
      courier: order.courier,
      createdAt: order.created_at,
      items: (items ?? []).map((i: { product_name_snapshot: string; qty: number; price: number; license_keys: { key_value: string } | null }) => ({
        productName: i.product_name_snapshot,
        qty: i.qty,
        price: Number(i.price),
        licenseKey: includeKeys ? i.license_keys?.key_value : undefined,
      })),
    })
  } catch (e) {
    console.error(e)
    return jsonResponse({ found: false, message: 'Something went wrong. Please try again.' }, 500)
  }
})
