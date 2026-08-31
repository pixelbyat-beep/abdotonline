import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Coupon } from '@/types/domain'

export function useAdminCoupons() {
  return useQuery({
    queryKey: ['admin', 'coupons'],
    queryFn: async () => {
      const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useSaveCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (coupon: Partial<Coupon> & { id?: string }) => {
      if (coupon.id) {
        const { error } = await supabase.from('coupons').update(coupon).eq('id', coupon.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('coupons').insert(coupon as Omit<Coupon, 'id' | 'created_at' | 'used_count'>)
        if (error) throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  })
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupons').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  })
}
