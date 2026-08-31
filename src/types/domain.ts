import type { Database } from './database.types'

export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type ProductImage = Database['public']['Tables']['product_images']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type LicenseKey = Database['public']['Tables']['license_keys']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type CartItemRow = Database['public']['Tables']['cart_items']['Row']
export type Wishlist = Database['public']['Tables']['wishlist']['Row']
export type Address = Database['public']['Tables']['addresses']['Row']
export type Coupon = Database['public']['Tables']['coupons']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type Enquiry = Database['public']['Tables']['enquiries']['Row']
export type Shipment = Database['public']['Tables']['shipments']['Row']
export type Blog = Database['public']['Tables']['blogs']['Row']
export type Setting = Database['public']['Tables']['settings']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']

export type ProductWithImages = Product & {
  product_images: ProductImage[]
  categories?: Pick<Category, 'id' | 'name' | 'slug'> | null
}

/** Item shape used by the cart store — deliberately decoupled from cart_items so guests work identically to logged-in users. */
export interface CartLine {
  productId: string
  qty: number
  // snapshot fields so the cart UI never has to refetch products just to render
  name: string
  slug: string
  price: number
  originalPrice: number | null
  image: string
  deliveryType: Product['delivery_type']
  stockQty: number
}

export interface SettingsMap {
  delivery_charge_courier: number
  delivery_charge_free_above: number
  delivery_email_charge: number
  cod_extra_charge: number
  cod_enabled: boolean
  low_stock_threshold: number
  store_name: string
  store_phone: string
  store_email: string
  razorpay_key_id: string
}
