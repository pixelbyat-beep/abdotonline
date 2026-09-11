import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export type ChartRange = 'today' | '7' | '30'
export interface ChartPoint {
  label: string
  value: number
}

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function hourBucketLabel(hour: number): string {
  const period = hour < 12 ? 'AM' : 'PM'
  let hour12 = hour % 12
  if (hour12 === 0) hour12 = 12
  return `${hour12}${period}`
}

function bucketToday<T extends { created_at: string }>(rows: T[], valueFn: (r: T) => number): ChartPoint[] {
  const today = startOfToday()
  const buckets = Array.from({ length: 8 }, (_, i) => ({ label: hourBucketLabel(i * 3), value: 0 }))
  for (const r of rows) {
    const d = new Date(r.created_at)
    if (d < today) continue
    buckets[Math.floor(d.getHours() / 3)].value += valueFn(r)
  }
  return buckets
}

function bucketByDays<T extends { created_at: string }>(rows: T[], days: number, valueFn: (r: T) => number): ChartPoint[] {
  const map = new Map<string, number>()
  for (let i = days - 1; i >= 0; i--) {
    const d = startOfToday()
    d.setDate(d.getDate() - i)
    map.set(d.toISOString().slice(0, 10), 0)
  }
  for (const r of rows) {
    const key = r.created_at.slice(0, 10)
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + valueFn(r))
  }
  return Array.from(map.entries()).map(([date, value]) => ({ label: date.slice(5), value }))
}

function buildChart<T extends { created_at: string }>(rows: T[], valueFn: (r: T) => number) {
  return {
    today: bucketToday(rows, valueFn),
    '7': bucketByDays(rows, 7, valueFn),
    '30': bucketByDays(rows, 30, valueFn),
  }
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const todayIso = startOfToday().toISOString()
      const days30Ago = startOfToday()
      days30Ago.setDate(days30Ago.getDate() - 29)
      const days30AgoIso = days30Ago.toISOString()

      const [
        totalOrdersRes,
        ordersTodayRes,
        totalSalesRes,
        totalCustomersRes,
        pendingPaymentsRes,
        pendingShipmentsRes,
        refundedOrdersRes,
        cancelledOrdersRes,
        recentOrdersRes,
        paidOrders30dRes,
        customers30dRes,
        orderItemsRes,
      ] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', todayIso),
        supabase.from('orders').select('total').eq('payment_status', 'paid'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('payment_status', 'pending'),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('delivery_type', 'courier')
          .eq('payment_status', 'paid')
          .in('order_status', ['pending', 'processing']),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('payment_status', 'refunded'),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('order_status', 'cancelled'),
        supabase
          .from('orders')
          .select('id, order_number, guest_name, total, payment_status, order_status, created_at')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('orders').select('total, created_at').eq('payment_status', 'paid').gte('created_at', days30AgoIso),
        supabase.from('profiles').select('created_at').eq('role', 'customer').gte('created_at', days30AgoIso),
        supabase
          .from('order_items')
          .select('product_id, qty, price, product_name_snapshot, orders!inner(payment_status)')
          .eq('orders.payment_status', 'paid'),
      ])

      const totalSales = (totalSalesRes.data ?? []).reduce((sum, o) => sum + Number(o.total), 0)
      const revenueToday = (paidOrders30dRes.data ?? [])
        .filter((o) => o.created_at >= todayIso)
        .reduce((sum, o) => sum + Number(o.total), 0)

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

      const bestSellersMap = new Map<string, { productId: string; name: string; unitsSold: number; revenue: number }>()
      for (const item of orderItemsRes.data ?? []) {
        const existing = bestSellersMap.get(item.product_id)
        if (existing) {
          existing.unitsSold += item.qty
          existing.revenue += item.qty * Number(item.price)
        } else {
          bestSellersMap.set(item.product_id, {
            productId: item.product_id,
            name: item.product_name_snapshot,
            unitsSold: item.qty,
            revenue: item.qty * Number(item.price),
          })
        }
      }
      const bestSellers = Array.from(bestSellersMap.values())
        .sort((a, b) => b.unitsSold - a.unitsSold)
        .slice(0, 5)

      return {
        totalSales,
        totalOrders: totalOrdersRes.count ?? 0,
        ordersToday: ordersTodayRes.count ?? 0,
        revenueToday,
        totalCustomers: totalCustomersRes.count ?? 0,
        pendingPayments: pendingPaymentsRes.count ?? 0,
        pendingShipments: pendingShipmentsRes.count ?? 0,
        refundedOrders: refundedOrdersRes.count ?? 0,
        cancelledOrders: cancelledOrdersRes.count ?? 0,
        lowStock,
        recentOrders: recentOrdersRes.data ?? [],
        bestSellers,
        salesChart: buildChart(paidOrders30dRes.data ?? [], (r) => Number(r.total)),
        customerChart: buildChart(customers30dRes.data ?? [], () => 1),
      }
    },
  })
}
