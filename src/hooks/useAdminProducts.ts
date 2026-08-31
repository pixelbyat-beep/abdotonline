import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Product, ProductImage } from '@/types/domain'

export type AdminProductWithImages = Product & { product_images: ProductImage[] }

export function useAdminProductsList() {
  return useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name), product_images(*)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useAdminProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'product', id],
    enabled: !!id && id !== 'new',
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*, product_images(*)').eq('id', id!).single()
      if (error) throw error
      return data as unknown as AdminProductWithImages
    },
  })
}

export function useSaveProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (product: Partial<Product> & { id?: string }) => {
      if (product.id) {
        const { error } = await supabase.from('products').update(product).eq('id', product.id)
        if (error) throw error
        return product.id
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(product as Omit<Product, 'id' | 'created_at' | 'discount_pct' | 'rating_avg' | 'rating_count'>)
          .select('id')
          .single()
        if (error) throw error
        return data.id
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
  })
}

export function useAllProductsBasic() {
  return useQuery({
    queryKey: ['admin', 'products', 'basic'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('id, name, brand, delivery_type').order('name')
      if (error) throw error
      return data
    },
  })
}
