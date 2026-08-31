import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export type PaymentFilter = 'all' | 'pending' | 'refunded' | 'cod'

export function useAdminPayments(filter: PaymentFilter) {
  return useQuery({
    queryKey: ['admin', 'payments', filter],
    queryFn: async () => {
      if (filter === 'cod') {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('payment_method', 'cod')
          .order('created_at', { ascending: false })
        if (error) throw error
        return data.map((o) => ({
          id: o.id,
          order_number: o.order_number,
          amount: o.total,
          method: 'cod',
          status: o.payment_status,
          created_at: o.created_at,
        }))
      }

      let query = supabase
        .from('payments')
        .select('*, orders(order_number)')
        .order('created_at', { ascending: false })
      if (filter === 'pending') query = query.eq('status', 'created')
      if (filter === 'refunded') query = query.eq('status', 'refunded')

      const { data, error } = await query
      if (error) throw error
      return data.map((p) => ({
        id: p.id,
        order_number: (p.orders as unknown as { order_number: string } | null)?.order_number ?? '—',
        amount: p.amount,
        method: p.method ?? 'online',
        status: p.status,
        created_at: p.created_at,
      }))
    },
  })
}

export function useRefundOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase.from('orders').update({ payment_status: 'refunded' }).eq('id', orderId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] }),
  })
}
