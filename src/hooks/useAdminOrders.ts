import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Order, OrderItem, Payment, Shipment } from '@/types/domain'

export type OrderFilter = 'all' | 'email' | 'courier' | 'pending' | 'cancelled' | 'cod'

export type AdminOrderDetail = Order & {
  order_items: (OrderItem & {
    products: { name: string; slug: string } | null
    license_keys: { key_value: string } | null
  })[]
  payments: Payment[]
  shipments: Shipment[]
}

export function useAdminOrders(filter: OrderFilter) {
  return useQuery({
    queryKey: ['admin', 'orders', filter],
    queryFn: async () => {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false })

      if (filter === 'email') query = query.eq('delivery_type', 'email')
      if (filter === 'courier') query = query.eq('delivery_type', 'courier')
      if (filter === 'pending') query = query.eq('order_status', 'pending')
      if (filter === 'cancelled') query = query.eq('order_status', 'cancelled')
      if (filter === 'cod') query = query.eq('payment_method', 'cod')

      const { data, error } = await query.limit(200)
      if (error) throw error
      return data
    },
  })
}

export function useAdminOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'order', orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name, slug), license_keys(key_value)), payments(*), shipments(*)')
        .eq('id', orderId!)
        .single()
      if (error) throw error
      return data as unknown as AdminOrderDetail
    },
  })
}

export interface OrderStatusPatch {
  order_status?: Order['order_status']
  tracking_number?: string
  courier?: string
  payment_status?: Order['payment_status']
}

export function useUpdateOrderStatus(orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (patch: OrderStatusPatch) => {
      const { error } = await supabase.from('orders').update(patch).eq('id', orderId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
    },
  })
}
