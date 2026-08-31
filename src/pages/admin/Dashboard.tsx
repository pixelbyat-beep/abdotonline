import { Link } from 'react-router-dom'
import { ShoppingCart, IndianRupee, Clock, AlertTriangle } from 'lucide-react'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { StatCard } from '@/components/admin/StatCard'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/OrderStatusBadge'
import { formatINR, formatDate } from '@/lib/formatters'

export default function Dashboard() {
  const { data, isLoading } = useDashboardStats()
  const maxRevenue = Math.max(1, ...(data?.revenueByDay.map((d) => d.revenue) ?? [1]))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Orders Today" value={isLoading ? '—' : String(data?.ordersToday ?? 0)} icon={ShoppingCart} />
        <StatCard label="Revenue Today" value={isLoading ? '—' : formatINR(data?.revenueToday ?? 0)} icon={IndianRupee} />
        <StatCard label="Pending Orders" value={isLoading ? '—' : String(data?.pendingCount ?? 0)} icon={Clock} tone="warning" />
        <StatCard label="Low Stock Alerts" value={isLoading ? '—' : String(data?.lowStock.length ?? 0)} icon={AlertTriangle} tone="danger" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-card border border-border bg-bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Revenue — Last 7 Days</h2>
          <div className="flex h-40 items-end gap-3">
            {data?.revenueByDay.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t bg-accent/70"
                  style={{ height: `${Math.max(4, (d.revenue / maxRevenue) * 120)}px` }}
                  title={formatINR(d.revenue)}
                />
                <span className="text-[10px] text-text-muted">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-card border border-border bg-bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Low Stock Alerts</h2>
          {data?.lowStock.length ? (
            <ul className="flex flex-col gap-2.5">
              {data.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{p.name}</span>
                  <span className="font-medium text-danger">{p.count} left</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary">All products are well stocked.</p>
          )}
        </div>
      </div>

      <div className="rounded-card border border-border bg-bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Recent Orders</h2>
        <div className="flex flex-col gap-2">
          {data?.recentOrders.map((o) => (
            <Link
              key={o.id}
              to={`/admin/orders/${o.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-btn px-3 py-2.5 text-sm hover:bg-bg-elevated"
            >
              <span className="font-medium text-text-primary">#{o.order_number}</span>
              <span className="text-text-secondary">{o.guest_name}</span>
              <span className="text-text-secondary">{formatDate(o.created_at)}</span>
              <PaymentStatusBadge status={o.payment_status} />
              <OrderStatusBadge status={o.order_status} />
              <span className="font-semibold text-text-primary">{formatINR(o.total)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
