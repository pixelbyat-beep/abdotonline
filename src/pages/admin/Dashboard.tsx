import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  IndianRupee,
  ShoppingCart,
  CalendarClock,
  Users,
  TrendingUp,
  CreditCard,
  Truck,
  Undo2,
  XCircle,
  AlertTriangle,
  Trophy,
} from 'lucide-react'
import { useDashboardStats, type ChartRange } from '@/hooks/useDashboardStats'
import { StatCard } from '@/components/admin/StatCard'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/OrderStatusBadge'
import { formatINR, formatDate } from '@/lib/formatters'

const RANGE_TABS: { key: ChartRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7', label: '7 Days' },
  { key: '30', label: '30 Days' },
]

export default function Dashboard() {
  const { data, isLoading } = useDashboardStats()
  const [chart, setChart] = useState<'sales' | 'customers'>('sales')
  const [range, setRange] = useState<ChartRange>('7')

  const points = chart === 'sales' ? data?.salesChart[range] : data?.customerChart[range]
  const maxValue = Math.max(1, ...(points?.map((p) => p.value) ?? [1]))
  const v = (n?: number) => (isLoading ? '—' : String(n ?? 0))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Store Metrics</p>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Dashboard Overview</h1>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> Sync Active
        </span>
      </div>

      {data && data.lowStock.length > 0 && (
        <Link to="/admin/license-keys/low-stock" className="flex items-center gap-3 rounded-card bg-danger/10 p-4 text-danger">
          <AlertTriangle size={20} className="shrink-0" />
          <span className="text-sm">
            <span className="font-semibold">Low inventory:</span> {data.lowStock.length} product{data.lowStock.length > 1 ? 's are' : ' is'} running low — restock soon.
          </span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total Sales" value={isLoading ? '—' : formatINR(data?.totalSales ?? 0)} icon={IndianRupee} tone="success" href="/admin/reports/sales" />
        <StatCard label="Total Orders" value={v(data?.totalOrders)} icon={ShoppingCart} tone="accent" href="/admin/orders" />
        <StatCard label="Today's Orders" value={v(data?.ordersToday)} icon={CalendarClock} tone="accent" href="/admin/orders" />
        <StatCard label="Total Customers" value={v(data?.totalCustomers)} icon={Users} tone="neutral" href="/admin/customers" />
        <StatCard label="Revenue Today" value={isLoading ? '—' : formatINR(data?.revenueToday ?? 0)} icon={TrendingUp} tone="success" href="/admin/reports/revenue" />
        <StatCard label="Pending Payments" value={v(data?.pendingPayments)} icon={CreditCard} tone="warning" href="/admin/payments/pending" />
        <StatCard label="Pending Shipments" value={v(data?.pendingShipments)} icon={Truck} tone="warning" href="/admin/shipping" />
        <StatCard label="Refunded Orders" value={v(data?.refundedOrders)} icon={Undo2} tone="danger" href="/admin/payments/refunds" />
        <StatCard label="Cancelled Orders" value={v(data?.cancelledOrders)} icon={XCircle} tone="danger" href="/admin/orders/cancelled" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0 rounded-card border border-border bg-bg-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 rounded-btn bg-bg-elevated p-1">
              {(['sales', 'customers'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setChart(c)}
                  className={`rounded-[4px] px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                    chart === c ? 'bg-accent text-on-accent' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {c === 'sales' ? 'Sales' : 'New Customers'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-btn bg-bg-elevated p-1">
              {RANGE_TABS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRange(r.key)}
                  className={`rounded-[4px] px-3 py-1.5 text-xs font-semibold transition-colors ${
                    range === r.key ? 'bg-accent text-on-accent' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="scrollbar-thin overflow-x-auto">
            <div className="flex h-40 min-w-[420px] items-end gap-2.5">
              {points?.map((p) => (
                <div key={p.label} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t bg-accent/70"
                    style={{ height: `${Math.max(4, (p.value / maxValue) * 120)}px` }}
                    title={chart === 'sales' ? formatINR(p.value) : `${p.value} new customers`}
                  />
                  <span className="whitespace-nowrap text-[10px] text-text-muted">{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-card border border-border bg-bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
            <AlertTriangle size={15} className="text-warning" /> Low Stock Alerts
          </h2>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-card border border-border bg-bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Trophy size={15} className="text-accent" /> Best Selling Products
          </h2>
          {data?.bestSellers.length ? (
            <ul className="flex flex-col gap-3">
              {data.bestSellers.map((p, i) => (
                <li key={p.productId} className="flex items-center gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg-elevated text-xs font-bold text-text-secondary">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-text-primary">{p.name}</span>
                  <span className="shrink-0 text-text-secondary">{p.unitsSold} sold</span>
                  <span className="shrink-0 font-semibold text-text-primary">{formatINR(p.revenue)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary">No sales yet.</p>
          )}
        </div>

        <div className="rounded-card border border-border bg-bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Recent Orders</h2>
          <div className="flex flex-col gap-2">
            {data?.recentOrders.length ? (
              data.recentOrders.map((o) => (
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
              ))
            ) : (
              <p className="text-sm text-text-secondary">No orders yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
