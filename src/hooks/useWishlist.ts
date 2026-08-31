import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthProvider'

export function useWishlist() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['wishlist', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('wishlist').select('product_id').eq('user_id', user!.id)
      if (error) throw error
      return data.map((r) => r.product_id)
    },
  })

  async function toggle(productId: string) {
    if (!user) return { requiresAuth: true }
    const isWishlisted = query.data?.includes(productId)
    if (isWishlisted) {
      await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', productId)
    } else {
      await supabase.from('wishlist').insert({ user_id: user.id, product_id: productId })
    }
    await queryClient.invalidateQueries({ queryKey: ['wishlist', user.id] })
    return { requiresAuth: false }
  }

  return {
    productIds: query.data ?? [],
    isLoading: query.isLoading,
    toggle,
  }
}
