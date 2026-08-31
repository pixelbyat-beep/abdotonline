import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Address } from '@/types/domain'

export function useAddresses(userId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['addresses', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('addresses').select('*').eq('user_id', userId!).order('is_default', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const upsert = useMutation({
    mutationFn: async (address: Omit<Address, 'id' | 'created_at'> & { id?: string }) => {
      const { error } = await supabase.from('addresses').upsert(address)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses', userId] }),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('addresses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses', userId] }),
  })

  return { ...query, upsert, remove }
}
