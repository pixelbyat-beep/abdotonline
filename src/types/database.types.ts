// Hand-written to mirror supabase/migrations exactly (Docker isn't available locally to
// run `supabase gen types`). If you add a migration, update this file to match.
// Regenerate properly later with: npx supabase gen types typescript --db-url "<connection-string>"

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          phone: string | null
          role: 'customer' | 'admin' | 'staff'
          blocked: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          status: 'active' | 'inactive'
          sort_order: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['categories']['Row']> & { name: string; slug: string }
        Update: Partial<Database['public']['Tables']['categories']['Row']>
        Relationships: []
      }
      products: {
        Row: {
          id: string
          category_id: string | null
          name: string
          slug: string
          brand: string | null
          description: string | null
          price: number
          original_price: number | null
          discount_pct: number
          delivery_type: 'email' | 'courier' | 'both'
          license_info: string | null
          stock_qty: number
          status: 'active' | 'inactive'
          featured: boolean
          meta_title: string | null
          meta_description: string | null
          rating_avg: number
          rating_count: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['products']['Row']> & { name: string; slug: string; price: number }
        Update: Partial<Database['public']['Tables']['products']['Row']>
        Relationships: []
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          storage_path: string
          is_primary: boolean
          sort_order: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['product_images']['Row']> & { product_id: string; storage_path: string }
        Update: Partial<Database['public']['Tables']['product_images']['Row']>
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string | null
          guest_name: string | null
          guest_email: string | null
          guest_phone: string | null
          subtotal: number
          delivery_charge: number
          discount_amount: number
          coupon_code: string | null
          total: number
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method: 'online' | 'cod'
          delivery_type: 'email' | 'courier'
          address_line: string | null
          city: string | null
          state: string | null
          pincode: string | null
          tracking_number: string | null
          courier: string | null
          order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          license_key_sent_at: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['orders']['Row']> & { order_number: string; delivery_type: 'email' | 'courier' }
        Update: Partial<Database['public']['Tables']['orders']['Row']>
        Relationships: []
      }
      license_keys: {
        Row: {
          id: string
          product_id: string
          key_value: string
          status: 'unused' | 'used' | 'expired'
          order_id: string | null
          used_at: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['license_keys']['Row']> & { product_id: string; key_value: string }
        Update: Partial<Database['public']['Tables']['license_keys']['Row']>
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          license_key_id: string | null
          qty: number
          price: number
          product_name_snapshot: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['order_items']['Row']> & {
          order_id: string
          product_id: string
          price: number
          product_name_snapshot: string
        }
        Update: Partial<Database['public']['Tables']['order_items']['Row']>
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          order_id: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          amount: number
          method: string | null
          status: 'created' | 'paid' | 'failed' | 'refunded'
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['payments']['Row']> & { order_id: string; amount: number }
        Update: Partial<Database['public']['Tables']['payments']['Row']>
        Relationships: []
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          qty: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['cart_items']['Row']> & { user_id: string; product_id: string }
        Update: Partial<Database['public']['Tables']['cart_items']['Row']>
        Relationships: []
      }
      wishlist: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['wishlist']['Row']> & { user_id: string; product_id: string }
        Update: Partial<Database['public']['Tables']['wishlist']['Row']>
        Relationships: []
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          label: string | null
          name: string
          phone: string
          address_line: string
          city: string
          state: string
          pincode: string
          is_default: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['addresses']['Row']> & {
          user_id: string
          name: string
          phone: string
          address_line: string
          city: string
          state: string
          pincode: string
        }
        Update: Partial<Database['public']['Tables']['addresses']['Row']>
        Relationships: []
      }
      coupons: {
        Row: {
          id: string
          code: string
          type: 'percent' | 'fixed'
          value: number
          min_order: number
          max_uses: number | null
          used_count: number
          expires_at: string | null
          status: 'active' | 'inactive'
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['coupons']['Row']> & { code: string; type: 'percent' | 'fixed'; value: number }
        Update: Partial<Database['public']['Tables']['coupons']['Row']>
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string | null
          guest_name: string | null
          rating: number
          comment: string | null
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['reviews']['Row']> & { product_id: string; rating: number }
        Update: Partial<Database['public']['Tables']['reviews']['Row']>
        Relationships: []
      }
      enquiries: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          message: string
          status: 'new' | 'read' | 'replied'
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['enquiries']['Row']> & { name: string; email: string; message: string }
        Update: Partial<Database['public']['Tables']['enquiries']['Row']>
        Relationships: []
      }
      shipments: {
        Row: {
          id: string
          order_id: string
          tracking_number: string | null
          courier_name: string | null
          status: string | null
          notes: string | null
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['shipments']['Row']> & { order_id: string }
        Update: Partial<Database['public']['Tables']['shipments']['Row']>
        Relationships: []
      }
      blogs: {
        Row: {
          id: string
          title: string
          slug: string
          content: string | null
          cover_image: string | null
          status: 'draft' | 'published'
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['blogs']['Row']> & { title: string; slug: string }
        Update: Partial<Database['public']['Tables']['blogs']['Row']>
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          key: string
          value: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['settings']['Row']> & { key: string }
        Update: Partial<Database['public']['Tables']['settings']['Row']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
