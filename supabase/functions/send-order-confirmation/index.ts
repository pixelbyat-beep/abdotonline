// Standalone endpoint to (re)send the order confirmation email — used internally by
// razorpay-webhook for courier orders, and available for admins to trigger manually.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { sendOrderConfirmationEmail } from '../_shared/email.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { orderId } = await req.json()
    if (!orderId) return jsonResponse({ error: 'orderId is required' }, 400)

    const admin = supabaseAdmin()

    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    const { data: userData } = await admin.auth.getUser(token)
    if (!userData.user) return jsonResponse({ error: 'Unauthorized' }, 401)
    const { data: profile } = await admin.from('profiles').select('role').eq('id', userData.user.id).single()
    if (!profile || !['admin', 'staff'].includes(profile.role)) return jsonResponse({ error: 'Forbidden' }, 403)

    const { data: order } = await admin.from('orders').select('*').eq('id', orderId).single()
    if (!order) return jsonResponse({ error: 'Order not found' }, 404)

    await sendOrderConfirmationEmail(admin, order)
    return jsonResponse({ ok: true })
  } catch (e) {
    console.error(e)
    return jsonResponse({ error: 'Unexpected error sending confirmation email' }, 500)
  }
})
