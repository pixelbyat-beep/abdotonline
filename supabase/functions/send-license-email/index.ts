// Used by the admin "Send License Key Email" button on the order detail page.
// Nothing sends automatically on payment — the admin writes their own message
// and decides when to click send.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { sendLicenseKeyEmail } from '../_shared/email.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { orderId, message } = await req.json()
    if (!orderId) return jsonResponse({ error: 'orderId is required' }, 400)

    const admin = supabaseAdmin()

    // Caller must be an admin/staff (checked via their JWT against profiles.role)
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    const { data: userData } = await admin.auth.getUser(token)
    if (!userData.user) return jsonResponse({ error: 'Unauthorized' }, 401)
    const { data: profile } = await admin.from('profiles').select('role').eq('id', userData.user.id).single()
    if (!profile || !['admin', 'staff'].includes(profile.role)) return jsonResponse({ error: 'Forbidden' }, 403)

    const { data: order } = await admin.from('orders').select('*').eq('id', orderId).single()
    if (!order) return jsonResponse({ error: 'Order not found' }, 404)
    if (order.payment_status !== 'paid') return jsonResponse({ error: 'Order is not paid yet' }, 400)

    const { data: items } = await admin.from('order_items').select('*, license_keys(key_value)').eq('order_id', orderId)
    await sendLicenseKeyEmail(admin, order, items ?? [], message)
    await admin
      .from('orders')
      .update({ license_key_sent_at: new Date().toISOString(), order_status: 'delivered' })
      .eq('id', orderId)

    return jsonResponse({ ok: true })
  } catch (e) {
    console.error(e)
    return jsonResponse({ error: 'Unexpected error sending email' }, 500)
  }
})
