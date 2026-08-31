import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export function useAdminReviews(status: 'pending' | 'approved') {
  return useQuery({
    queryKey: ['admin', 'reviews', status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, products(name)')
        .eq('status', status)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useModerateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase.from('reviews').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] }),
  })
}
