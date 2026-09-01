import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export function useLicenseKeys() {
  return useQuery({
    queryKey: ['admin', 'license-keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('license_keys')
        .select('*, products(name), orders(order_number, guest_email)')
        .order('created_at', { ascending: false })
        .limit(500)
      if (error) throw error
      return data
    },
  })
}

export function useAddLicenseKeys() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ productId, keys }: { productId: string; keys: string[] }) => {
      const rows = keys.map((key_value) => ({ product_id: productId, key_value, status: 'unused' as const }))
      const { error } = await supabase.from('license_keys').insert(rows)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'license-keys'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}

export function useDeleteLicenseKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('license_keys').delete().eq('id', id).eq('status', 'unused')
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'license-keys'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}

export function useLowStockProducts(threshold: number) {
  return useQuery({
    queryKey: ['admin', 'low-stock', threshold],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, brand')
        .eq('status', 'active')
        .or('delivery_type.eq.email,delivery_type.eq.both')
      if (error) throw error

      const results = []
      for (const p of products ?? []) {
        const { count } = await supabase
          .from('license_keys')
          .select('id', { count: 'exact', head: true })
          .eq('product_id', p.id)
          .eq('status', 'unused')
        if ((count ?? 0) < threshold) results.push({ ...p, unusedCount: count ?? 0 })
      }
      return results
    },
  })
}
