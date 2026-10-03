import { useMemo, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Search, Mail, Truck, Clock } from 'lucide-react'
import { useAdminOrders, type OrderFilter } from '@/hooks/useAdminOrders'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/OrderStatusBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate, formatINR } from '@/lib/formatters'
import { cn } from '@/lib/cn'

const TABS = [
  { label: 'All', href: '/admin/orders', end: true },
  { label: 'Email', href: '/admin/orders/email' },
  { label: 'Courier', href: '/admin/orders/courier' },
  { label: 'Pending', href: '/admin/orders/pending' },
  { label: 'Cancelled', href: '/admin/orders/cancelled' },
]

export function OrdersList({ filter, title }: { filter: OrderFilter; title: string }) {
  const { data: orders, isLoading } = useAdminOrders(filter)
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return orders ?? []
    return (orders ?? []).filter((o) => [o.order_number, o.guest_name, o.guest_email].some((v) => (v ?? '').toLowerCase().includes(q)))
  }, [orders, query])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Orders</p>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">{title}</h1>
      </div>

      <label className="flex items-center gap-3 rounded-xl bg-bg-card px-4 py-3 shadow-[0_1px_3px_rgba(11,28,48,0.06)] focus-within:ring-2 focus-within:ring-accent/30">
        <Search size={18} className="text-text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search order ID, customer or email..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-text-muted"
        />
      </label>

      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-thin">
        {TABS.map((t) => (
          <NavLink
            key={t.href}
            to={t.href}
            end={t.end}
            className={({ isActive }) =>
              cn(
                'shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                isActive ? 'bg-accent text-on-accent shadow-sm' : 'bg-bg-card text-text-secondary hover:bg-bg-elevated',
              )
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-card" />)
        ) : rows.length === 0 ? (
          <p className="col-span-full rounded-card bg-bg-card p-10 text-center text-text-secondary">No orders found.</p>
        ) : (
          rows.map((o) => {
            const initials = (o.guest_name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
            return (
              <Link key={o.id} to={`/admin/orders/${o.id}`} className="rounded-card bg-bg-card p-4 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text-primary">#{o.order_number}</span>
                    <span
                      className={cn(
                        'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        o.delivery_type === 'email' ? 'bg-accent/10 text-accent' : 'text-text-secondary',
                      )}
                      style={o.delivery_type === 'courier' ? { background: '#dae2fd' } : undefined}
                    >
                      {o.delivery_type === 'email' ? <Mail size={11} /> : <Truck size={11} />}
                      {o.delivery_type === 'email' ? 'Digital' : 'Courier'}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-text-primary">{formatINR(o.total)}</span>
                </div>
                <div className="mt-2 flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">{initials}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">{o.guest_name || '—'}</p>
                    <p className="truncate text-xs text-text-secondary">{o.guest_email}</p>
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
        )}
      </div>
    </div>
  )
}
