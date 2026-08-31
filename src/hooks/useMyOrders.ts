import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export function useMyOrders(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-orders', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name, slug))')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}
