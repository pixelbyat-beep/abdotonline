import { edgeFunctionUrl } from '@/lib/supabaseClient'

export interface OrderLookupItem {
  productName: string
  qty: number
  price: number
  licenseKey?: string
}

export interface OrderLookupResult {
  found: boolean
  message?: string
  orderNumber?: string
  orderStatus?: string
  paymentStatus?: string
  paymentMethod?: string
  deliveryType?: string
  subtotal?: number
  deliveryCharge?: number
  discountAmount?: number
  total?: number
  trackingNumber?: string | null
  courier?: string | null
  createdAt?: string
  items?: OrderLookupItem[]
}

export async function lookupOrder(orderNumber: string, email: string): Promise<OrderLookupResult> {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const res = await fetch(edgeFunctionUrl('track-order'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ orderNumber, email }),
  })
  if (!res.ok) return { found: false, message: 'Something went wrong. Please try again.' }
  return res.json()
}
