import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export function useProductReviews(productId: string | undefined) {
  return useQuery({
    queryKey: ['reviews', productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId!)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useSubmitReview(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { rating: number; comment: string; guestName?: string; userId?: string }) => {
      const { error } = await supabase.from('reviews').insert({
        product_id: productId,
        rating: input.rating,
        comment: input.comment,
        guest_name: input.guestName,
        user_id: input.userId,
        status: 'pending',
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews', productId] }),
  })
}
