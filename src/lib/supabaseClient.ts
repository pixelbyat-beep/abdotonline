import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — copy .env.example to .env and fill them in.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export function publicImageUrl(storagePath: string): string {
  if (!storagePath) return ''
  // http(s) URLs and root-relative paths (self-hosted assets under /public, e.g. /product-art/*.svg)
  // are used as-is; anything else is treated as a Supabase Storage object path.
  if (storagePath.startsWith('http') || storagePath.startsWith('/')) return storagePath
  return supabase.storage.from('store-assets').getPublicUrl(storagePath).data.publicUrl
}

export function edgeFunctionUrl(name: string): string {
  return `${supabaseUrl}/functions/v1/${name}`
}
