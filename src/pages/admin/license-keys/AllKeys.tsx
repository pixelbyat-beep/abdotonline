import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ShieldCheck, Lock, Eye, EyeOff, Trash2, Plus, Mail, KeyRound, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useLicenseKeys, useDeleteLicenseKey } from '@/hooks/useLicenseKeys'
import { useSettings } from '@/hooks/useSettings'
import { Skeleton } from '@/components/ui/Skeleton'
import { maskLicenseKey, formatDateTime } from '@/lib/formatters'
import { cn } from '@/lib/cn'

interface KeyRow {
  id: string
  key_value: string
  status: 'unused' | 'used' | 'expired'
  used_at: string | null
  created_at: string
  product_id: string
  products: { name: string } | null
  orders: { order_number: string; guest_email: string } | null
}

const STATUS_LABEL = { unused: 'Available', used: 'Delivered', expired: 'Expired' } as const
const STATUS_STYLE = {
  unused: 'bg-success/10 text-success',
  used: 'bg-accent/10 text-accent',
  expired: 'bg-danger/10 text-danger',
} as const

const FILTERS = ['all', 'unused', 'used', 'expired'] as const

export default function AllKeys() {
  const { data, isLoading } = useLicenseKeys()
  const { data: settings } = useSettings()
  const deleteKey = useDeleteLicenseKey()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  const rows = (data as unknown as KeyRow[]) ?? []
  const threshold = settings?.low_stock_threshold ?? 10

  const pools = useMemo(() => {
    const map = new Map<string, { name: string; available: number; total: number }>()
    for (const r of rows) {
      const p = map.get(r.product_id) ?? { name: r.products?.name ?? 'Unknown product', available: 0, total: 0 }
      p.total += 1
      if (r.status === 'unused') p.available += 1
      map.set(r.product_id, p)
    }
    return Array.from(map.values()).sort((a, b) => a.available - b.available)
  }, [rows])

  const available = rows.filter((r) => r.status === 'unused').length
  const delivered = rows.filter((r) => r.status === 'used').length
  const maxPool = Math.max(1, ...pools.map((p) => p.total))

  const visible = rows.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return [r.products?.name, r.orders?.order_number, r.orders?.guest_email, r.key_value].some((v) => (v ?? '').toLowerCase().includes(q))
  })

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Digital Key Inventory</h1>
          <p className="text-sm text-text-secondary">Manage, verify, and fulfill software license keys securely.</p>
        </div>
        <Link to="/admin/license-keys/add" className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent shadow-sm hover:bg-accent-dark">
          <Plus size={16} /> Add Keys
        </Link>
      </div>

      <div className="flex items-start gap-3 rounded-card bg-accent/10 p-4">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-accent" />
        <div className="text-sm text-text-secondary">
          <p className="font-semibold text-text-primary">Security protocol active</p>
          Keys stay masked in this list. Use <b>Reveal</b> only when you need to verify a key.
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Keys', value: rows.length, sub: 'in vault', tone: 'text-text-primary' },
          { label: 'Available', value: available, sub: 'Unassigned pool', tone: 'text-success' },
          { label: 'Delivered', value: delivered, sub: 'Sent to customers', tone: 'text-accent' },
        ].map((s) => (
          <div key={s.label} className="rounded-card bg-bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{s.label}</p>
            <p className={cn('mt-1 text-3xl font-bold tracking-tight', s.tone)}>{isLoading ? '—' : s.value.toLocaleString('en-IN')}</p>
            <p className="text-xs text-text-secondary">{s.sub}</p>
          </div>
        ))}
      </div>

      <section className="rounded-card bg-bg-card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-text-primary">
          <KeyRound size={17} className="text-accent" /> Key Pools Stock Status
        </h2>
        {pools.length === 0 ? (
          <p className="text-sm text-text-secondary">No keys added yet.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {pools.map((p) => {
              const low = p.available < threshold
              return (
                <div key={p.name} className={cn('rounded-xl p-3', low ? 'bg-danger/10' : 'bg-bg-elevated')}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-text-primary">
                      {low ? <AlertTriangle size={15} className="shrink-0 text-danger" /> : <CheckCircle2 size={15} className="shrink-0 text-success" />}
                      <span className="truncate">{p.name}</span>
                    </span>
                    {low ? (
                      <Link to="/admin/license-keys/add" className="flex shrink-0 items-center gap-1 rounded-lg bg-danger px-2.5 py-1 text-xs font-semibold text-white">
                        <Plus size={12} /> Restock
                      </Link>
                    ) : (
                      <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">Healthy</span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className={cn('w-32 shrink-0 whitespace-nowrap text-xs font-bold', low ? 'text-danger' : 'text-text-primary')}>
                      {p.available} {low ? 'CRITICAL LOW' : 'available'}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-card">
                      <div className={cn('h-full rounded-full', low ? 'bg-danger' : 'bg-accent')} style={{ width: `${Math.max(3, (p.available / maxPool) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <label className="flex items-center gap-3 rounded-xl bg-bg-card px-4 py-3 shadow-[0_1px_3px_rgba(11,28,48,0.06)] focus-within:ring-2 focus-within:ring-accent/30">
        <Search size={18} className="text-text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search order ID, customer email or product..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-text-muted"
        />
      </label>
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-thin">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors',
              filter === f ? 'bg-accent text-on-accent shadow-sm' : 'bg-bg-card text-text-secondary hover:bg-bg-elevated',
            )}
          >
            {f === 'all' ? `All (${rows.length})` : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-card" />)
        ) : visible.length === 0 ? (
          <p className="col-span-full rounded-card bg-bg-card p-10 text-center text-text-secondary">No keys found.</p>
        ) : (
          visible.map((r) => (
            <div key={r.id} className="rounded-card bg-bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', STATUS_STYLE[r.status])}>{STATUS_LABEL[r.status]}</span>
                {r.status === 'unused' && (
                  <button
                    onClick={() => {
                      if (confirm('Delete this unused license key?')) deleteKey.mutate(r.id)
                    }}
                    title="Delete key"
                    className="rounded-lg p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <p className="mt-2 text-base font-bold leading-snug text-text-primary">{r.products?.name ?? '—'}</p>
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-bg-elevated p-2.5">
                <Lock size={15} className="shrink-0 text-text-muted" />
                <span className="min-w-0 flex-1 truncate font-mono text-sm text-text-primary">
                  {revealed[r.id] ? r.key_value : maskLicenseKey(r.key_value).replace(/\*/g, 'X')}
                </span>
                <button
                  onClick={() => setRevealed((v) => ({ ...v, [r.id]: !v[r.id] }))}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-accent/10 px-2.5 py-1.5 text-xs font-semibold text-accent"
                >
                  {revealed[r.id] ? <EyeOff size={13} /> : <Eye size={13} />} {revealed[r.id] ? 'Hide' : 'Reveal'}
                </button>
              </div>
              {r.orders ? (
                <div className="mt-3 flex flex-col gap-1 text-xs text-text-secondary">
                  <div className="flex justify-between"><span>Order Reference</span><span className="font-semibold text-accent">#{r.orders.order_number}</span></div>
                  <div className="flex justify-between"><span>Customer</span><span className="truncate pl-3 text-text-primary">{r.orders.guest_email}</span></div>
                  {r.used_at && (
                    <div className="flex items-center gap-1 text-success"><Mail size={12} /> Assigned {formatDateTime(r.used_at)}</div>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-xs text-text-muted">Added {formatDateTime(r.created_at)}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
