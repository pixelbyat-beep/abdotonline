// Validates a coupon without ever exposing the full coupon list to the client
// (there is deliberately no public RLS SELECT policy on the coupons table).
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { code, subtotal } = await req.json()
    if (!code) return jsonResponse({ valid: false, message: 'Please enter a coupon code' }, 400)

    const admin = supabaseAdmin()
    const { data: coupon } = await admin.from('coupons').select('*').ilike('code', code.trim()).eq('status', 'active').maybeSingle()

    if (!coupon) return jsonResponse({ valid: false, message: 'Invalid coupon code' })
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return jsonResponse({ valid: false, message: 'This coupon has expired' })
    }
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return jsonResponse({ valid: false, message: 'This coupon has reached its usage limit' })
    }
    if (Number(subtotal) < Number(coupon.min_order)) {
      return jsonResponse({ valid: false, message: `Minimum order of ₹${coupon.min_order} required for this coupon` })
    }

    return jsonResponse({ valid: true, code: coupon.code, type: coupon.type, value: Number(coupon.value) })
  } catch (e) {
    console.error(e)
    return jsonResponse({ valid: false, message: 'Could not validate coupon right now' }, 500)
  }
})
