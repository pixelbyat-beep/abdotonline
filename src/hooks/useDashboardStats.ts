import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

function startOfToday(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const [ordersToday, pendingOrders, recentOrders, last7Days] = await Promise.all([
        supabase.from('orders').select('total', { count: 'exact' }).gte('created_at', startOfToday()).eq('payment_status', 'paid'),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('order_status', 'pending'),
        supabase
          .from('orders')
          .select('id, order_number, guest_name, total, payment_status, order_status, created_at')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('orders')
          .select('total, created_at')
          .eq('payment_status', 'paid')
          .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
      ])

      const revenueToday = (ordersToday.data ?? []).reduce((sum, o) => sum + Number(o.total), 0)

      // low stock: products where unused license key count < low_stock_threshold
      const { data: settingsRow } = await supabase.from('settings').select('value').eq('key', 'low_stock_threshold').single()
      const threshold = Number(settingsRow?.value ?? 10)

      const { data: products } = await supabase.from('products').select('id, name').eq('status', 'active').or('delivery_type.eq.email,delivery_type.eq.both')
      const lowStock: { id: string; name: string; count: number }[] = []
      if (products) {
        for (const p of products) {
          const { count } = await supabase
            .from('license_keys')
            .select('id', { count: 'exact', head: true })
            .eq('product_id', p.id)
            .eq('status', 'unused')
          if ((count ?? 0) < threshold) lowStock.push({ id: p.id, name: p.name, count: count ?? 0 })
        }
      }

      // revenue per day for last 7 days
      const byDay: Record<string, number> = {}
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000)
        byDay[d.toISOString().slice(0, 10)] = 0
      }
      for (const o of last7Days.data ?? []) {
        const key = o.created_at.slice(0, 10)
        if (key in byDay) byDay[key] += Number(o.total)
      }

      return {
        ordersToday: ordersToday.count ?? 0,
        revenueToday,
        pendingCount: pendingOrders.count ?? 0,
        lowStock,
        recentOrders: recentOrders.data ?? [],
        revenueByDay: Object.entries(byDay).map(([date, revenue]) => ({ date, revenue })),
      }
    },
  })
}
