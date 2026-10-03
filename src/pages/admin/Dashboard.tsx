import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  IndianRupee,
  ShoppingCart,
  KeyRound,
  Package,
  CreditCard,
  Truck,
  Mail,
  AlertTriangle,
  Trophy,
  Plus,
  ArrowRight,
  Clock,
  Users,
  Undo2,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { useDashboardStats, type ChartRange } from '@/hooks/useDashboardStats'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/OrderStatusBadge'
import { formatINR, formatDate } from '@/lib/formatters'
import { cn } from '@/lib/cn'

const RANGE_TABS: { key: ChartRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7', label: 'Last 7 Days' },
  { key: '30', label: 'This Month' },
]

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values)
  const w = 100
  const h = 28
  const pts = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * w},${h - (v / max) * (h - 3) - 1}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-7 w-full" preserveAspectRatio="none">
      <polyline points={`0,${h} ${pts} ${w},${h}`} className="fill-success/10 stroke-none" />
      <polyline points={pts} fill="none" className="stroke-success" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function Kpi({
  label,
  value,
  icon: Icon,
  tone = 'accent',
  footer,
  href,
  children,
}: {
  label: string
  value: string
  icon: LucideIcon
  tone?: 'accent' | 'success' | 'danger' | 'warning'
  footer?: React.ReactNode
  href: string
  children?: React.ReactNode
}) {
  const toneBg = { accent: 'bg-accent/10 text-accent', success: 'bg-success/10 text-success', danger: 'bg-danger/10 text-danger', warning: 'bg-warning/10 text-warning' }[tone]
  return (
    <Link to={href} className="flex flex-col rounded-card bg-bg-card p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">{label}</span>
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', toneBg)}>
          <Icon size={16} />
        </span>
      </div>
      <p className={cn('mt-2 text-3xl font-bold tracking-tight', tone === 'danger' ? 'text-danger' : 'text-text-primary')}>{value}</p>
      {children}
      {footer && <div className="mt-2 border-t border-border pt-2 text-xs">{footer}</div>}
    </Link>
  )
}

export default function Dashboard() {
  const { data, isLoading } = useDashboardStats()
  const [chart, setChart] = useState<'sales' | 'customers'>('sales')
  const [range, setRange] = useState<ChartRange>('7')

  const points = chart === 'sales' ? data?.salesChart[range] : data?.customerChart[range]
  const maxValue = Math.max(1, ...(points?.map((p) => p.value) ?? [1]))
  const dash = (n?: number) => (isLoading ? '—' : String(n ?? 0))

  const digital = data?.digitalOrders ?? 0
  const courier = data?.courierOrders ?? 0
  const pipelineTotal = Math.max(1, digital + courier)
  const digitalPct = Math.round((digital / pipelineTotal) * 100)
  const sparkValues = data?.salesChart['7'].map((p) => p.value) ?? []

  const lowKeys = data?.lowStock ?? []
  const worst = [...lowKeys].sort((a, b) => a.count - b.count)[0]

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Store Metrics</p>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Dashboard Overview</h1>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> Sync Active
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-thin">
        {RANGE_TABS.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
              range === r.key ? 'bg-accent text-on-accent shadow-sm' : 'bg-bg-card text-text-secondary hover:bg-bg-elevated',
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {worst && (
        <div className="flex flex-wrap items-center gap-3 rounded-card bg-danger/10 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-danger/15 text-danger">
            <KeyRound size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-danger">Low key inventory</p>
            <p className="text-sm text-text-primary">
              <span className="font-bold text-danger">{worst.count} {worst.count === 1 ? "key" : "keys"} remaining</span> for {worst.name}
              {lowKeys.length > 1 ? ` and ${lowKeys.length - 1} more` : ''} — reorder recommended.
            </p>
          </div>
          <Link to="/admin/license-keys/add" className="flex items-center gap-1.5 rounded-lg bg-danger px-3.5 py-2 text-sm font-semibold text-white">
            <Plus size={15} /> Add Keys
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total Revenue" value={isLoading ? '—' : formatINR(data?.totalSales ?? 0)} icon={IndianRupee} tone="success" href="/admin/reports/revenue">
          <Sparkline values={sparkValues} />
        </Kpi>
        <Kpi
          label="Total Orders"
          value={dash(data?.totalOrders)}
          icon={ShoppingCart}
          href="/admin/orders"
          footer={
            <span className="flex items-center justify-between text-text-secondary">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> {dash(data?.pendingPayments)} pending</span>
              <span className="font-semibold text-accent">{dash(data?.openOrders)} in fulfillment</span>
            </span>
          }
        />
        <Kpi
          label="Digital Keys"
          value={dash(data?.unusedKeys)}
          icon={KeyRound}
          href="/admin/license-keys"
          footer={<span className="font-semibold text-success">● Unassigned</span>}
        />
        <Kpi
          label="Low Stock"
          value={dash(lowKeys.length)}
          icon={Package}
          tone="danger"
          href="/admin/license-keys/low-stock"
          footer={
            <span className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-danger"><AlertTriangle size={12} /> Below threshold</span>
              <span className="font-semibold text-danger">Reorder</span>
            </span>
          }
        />
      </div>

      <section className="rounded-card bg-bg-card p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Fulfillment Pipeline</h2>
            <p className="text-sm text-text-secondary">Digital auto-delivery vs physical courier</p>
          </div>
          <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">Live Feed</span>
        </div>
        <div className="mb-1.5 flex justify-between text-sm font-medium text-text-primary">
          <span className="flex items-center gap-1.5 text-accent"><Mail size={14} /> Digital ({digitalPct}% · {digital} orders)</span>
          <span className="flex items-center gap-1.5 text-text-secondary"><Truck size={14} /> Courier ({100 - digitalPct}% · {courier})</span>
        </div>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-bg-elevated">
          <div className="bg-accent" style={{ width: `${digitalPct}%` }} />
          <div style={{ width: `${100 - digitalPct}%`, background: '#565e74' }} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-xl bg-bg-elevated p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success"><CreditCard size={17} /></span>
            <div>
              <p className="text-lg font-bold text-text-primary">{dash(data?.pendingPayments)}</p>
              <p className="text-xs text-text-secondary">Pending payments</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-bg-elevated p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent"><Clock size={17} /></span>
            <div>
              <p className="text-lg font-bold text-text-primary">{dash(data?.pendingShipments)}</p>
              <p className="text-xs text-text-secondary">Awaiting shipment</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Quick Actions</p>
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
          {[
            { label: 'Add Product', icon: Package, href: '/admin/products/new' },
            { label: 'Bulk Keys', icon: KeyRound, href: '/admin/license-keys/add' },
            { label: 'Pending Orders', icon: ShoppingCart, href: '/admin/orders/pending' },
            { label: 'Customers', icon: Users, href: '/admin/customers' },
            { label: 'Refunds', icon: Undo2, href: '/admin/payments/refunds' },
            { label: 'Cancelled', icon: XCircle, href: '/admin/orders/cancelled' },
          ].map((a) => (
            <Link
              key={a.label}
              to={a.href}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-bg-card px-4 py-3 text-sm font-semibold text-text-primary shadow-[0_1px_3px_rgba(11,28,48,0.06)] hover:bg-bg-elevated"
            >
              <a.icon size={17} className="text-accent" /> {a.label}
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0 rounded-card bg-bg-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-text-primary">{chart === 'sales' ? 'Sales' : 'New Customers'}</h2>
            <div className="flex items-center gap-1 rounded-lg bg-bg-elevated p-1">
              {(['sales', 'customers'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setChart(c)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                    chart === c ? 'bg-bg-card text-accent shadow-sm' : 'text-text-secondary hover:text-text-primary',
                  )}
                >
                  {c === 'sales' ? 'Sales' : 'Customers'}
                </button>
              ))}
            </div>
          </div>
          <div className="scrollbar-thin overflow-x-auto">
            <div className="flex h-40 min-w-[420px] items-end gap-2.5">
              {points?.map((p) => (
                <div key={p.label} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-md bg-accent/75"
                    style={{ height: `${Math.max(4, (p.value / maxValue) * 120)}px` }}
                    title={chart === 'sales' ? formatINR(p.value) : `${p.value} new customers`}
                  />
                  <span className="whitespace-nowrap text-[10px] text-text-muted">{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-card bg-bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-text-primary">
            <Trophy size={16} className="text-accent" /> Best Selling
          </h2>
          {data?.bestSellers.length ? (
            <ul className="flex flex-col gap-3">
              {data.bestSellers.map((p, i) => (
                <li key={p.productId} className="flex items-center gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">{i + 1}</span>
                  <span className="flex-1 truncate text-text-primary">{p.name}</span>
                  <span className="shrink-0 text-xs text-text-secondary">{p.unitsSold} sold</span>
                  <span className="shrink-0 font-semibold text-text-primary">{formatINR(p.revenue)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary">No sales yet.</p>
          )}
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-text-primary">
            Live Order Stream <span className="h-2 w-2 rounded-full bg-success" />
          </h2>
          <Link to="/admin/orders" className="flex items-center gap-1 text-sm font-semibold text-accent">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {data?.recentOrders.length ? (
            data.recentOrders.map((o) => {
              const items = (o as unknown as { order_items?: { product_name_snapshot: string; qty: number }[] }).order_items ?? []
              const initials = (o.guest_name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
              return (
                <Link key={o.id} to={`/admin/orders/${o.id}`} className="rounded-card bg-bg-card p-4 transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-primary">#{o.order_number}</span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          o.delivery_type === 'email' ? 'bg-accent/10 text-accent' : 'text-text-secondary',
                        )}
                        style={o.delivery_type === 'courier' ? { background: '#dae2fd' } : undefined}
                      >
                        {o.delivery_type === 'email' ? 'Digital Auto-Delivered' : 'Courier'}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-text-primary">{formatINR(o.total)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">{initials}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">{o.guest_name}</p>
                      <p className="truncate text-xs text-text-secondary">
                        {items.length ? items.map((i) => `${i.qty}x ${i.product_name_snapshot}`).join(', ') : o.guest_email}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-bg-elevated px-3 py-2">
                    <PaymentStatusBadge status={o.payment_status} />
                    <OrderStatusBadge status={o.order_status} />
                  </div>
                  <p className="mt-2 flex items-center gap-1 text-xs text-text-muted">
                    <Clock size={12} /> {formatDate(o.created_at)}
                  </p>
                </Link>
              )
            })
          ) : (
            <p className="text-sm text-text-secondary">No orders yet.</p>
          )}
        </div>
        <Link
          to="/admin/orders"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-on-accent shadow-sm hover:bg-accent-dark"
        >
          View All Orders ({dash(data?.totalOrders)}) <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  )
}
