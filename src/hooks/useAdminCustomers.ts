import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export function useAdminCustomers(blockedOnly = false) {
  return useQuery({
    queryKey: ['admin', 'customers', blockedOnly],
    queryFn: async () => {
      let query = supabase.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false })
      if (blockedOnly) query = query.eq('blocked', true)
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useToggleCustomerBlock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, blocked }: { id: string; blocked: boolean }) => {
      const { error } = await supabase.from('profiles').update({ blocked }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] }),
  })
}
