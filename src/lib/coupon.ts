import { edgeFunctionUrl, supabase } from './supabaseClient'

export interface CouponValidationResult {
  valid: boolean
  message?: string
  code?: string
  type?: 'percent' | 'fixed'
  value?: number
  discountAmount?: number
}

export async function validateCoupon(code: string, subtotal: number): Promise<CouponValidationResult> {
  const { data: sessionData } = await supabase.auth.getSession()
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  const res = await fetch(edgeFunctionUrl('validate-coupon'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${sessionData.session?.access_token ?? anonKey}`,
    },
    body: JSON.stringify({ code, subtotal }),
  })

  if (!res.ok) {
    return { valid: false, message: 'Could not validate coupon right now' }
  }
  return res.json()
}
