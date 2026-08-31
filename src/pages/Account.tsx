import { useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Package, MapPin, User as UserIcon, LogOut, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthProvider'
import { useMyOrders } from '@/hooks/useMyOrders'
import { useAddresses } from '@/hooks/useAddresses'
import { supabase } from '@/lib/supabaseClient'
import { formatDate, formatINR } from '@/lib/formatters'
import { toast } from '@/store/toastStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

type Tab = 'orders' | 'addresses' | 'profile'

export default function Account() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth()
  const [tab, setTab] = useState<Tab>('orders')

  if (loading) return null
  if (!user) return <Navigate to="/auth" state={{ from: '/account' }} replace />

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">My Account</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
        <div className="flex flex-row gap-2 overflow-x-auto md:flex-col">
          {([
            ['orders', 'My Orders', Package],
            ['addresses', 'Addresses', MapPin],
            ['profile', 'Profile', UserIcon],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex shrink-0 items-center gap-2.5 rounded-btn px-3.5 py-2.5 text-sm',
                tab === key ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
              )}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
          <button
            onClick={signOut}
            className="flex shrink-0 items-center gap-2.5 rounded-btn px-3.5 py-2.5 text-sm text-danger hover:bg-danger/10"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>

        <div>
          {tab === 'orders' && <OrdersTab userId={user.id} />}
          {tab === 'addresses' && <AddressesTab userId={user.id} />}
          {tab === 'profile' && <ProfileTab userId={user.id} name={profile?.name ?? ''} phone={profile?.phone ?? ''} onSaved={refreshProfile} />}
        </div>
      </div>
    </div>
  )
}

function OrdersTab({ userId }: { userId: string }) {
  const { data: orders, isLoading } = useMyOrders(userId)

  if (isLoading) return <p className="text-sm text-text-secondary">Loading orders...</p>
  if (!orders || orders.length === 0) {
    return (
      <div className="rounded-card border border-border bg-bg-card p-8 text-center">
        <p className="text-text-secondary">You haven't placed any orders yet.</p>
        <Link to="/listing" className="mt-4 inline-block">
          <Button>Browse Products</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => (
        <div key={order.id} className="rounded-card border border-border bg-bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-text-primary">#{order.order_number}</p>
              <p className="text-xs text-text-muted">{formatDate(order.created_at)}</p>
            </div>
            <div className="flex gap-2">
              <Badge tone={order.payment_status === 'paid' ? 'success' : 'warning'}>{order.payment_status}</Badge>
              <Badge tone="accent">{order.order_status}</Badge>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-sm text-text-secondary">
            {(order.order_items as unknown as { qty: number; products: { name: string } | null }[])?.map((item, i) => (
              <span key={i}>
                {item.products?.name} × {item.qty}
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm font-semibold text-text-primary">{formatINR(order.total)}</span>
            <Link to={`/order-success/${order.order_number}?email=${encodeURIComponent(order.guest_email || '')}`} className="text-sm text-accent hover:underline">
              View Details
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

function AddressesTab({ userId }: { userId: string }) {
  const { data: addresses, isLoading, upsert, remove } = useAddresses(userId)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ label: 'Home', name: '', phone: '', address_line: '', city: '', state: '', pincode: '' })

  async function handleSave() {
    await upsert.mutateAsync({ ...form, user_id: userId, is_default: !addresses?.length })
    setForm({ label: 'Home', name: '', phone: '', address_line: '', city: '', state: '', pincode: '' })
    setShowForm(false)
    toast('Address saved', 'success')
  }

  return (
    <div className="flex flex-col gap-3">
      {isLoading && <p className="text-sm text-text-secondary">Loading...</p>}
      {addresses?.map((addr) => (
        <div key={addr.id} className="flex items-start justify-between rounded-card border border-border bg-bg-card p-4">
          <div>
            <p className="text-sm font-medium text-text-primary">
              {addr.label} {addr.is_default && <Badge tone="accent" className="ml-1">Default</Badge>}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {addr.name}, {addr.address_line}, {addr.city}, {addr.state} - {addr.pincode}
            </p>
            <p className="text-sm text-text-secondary">{addr.phone}</p>
          </div>
          <button onClick={() => remove.mutate(addr.id)} className="text-text-muted hover:text-danger">
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      {showForm ? (
        <div className="rounded-card border border-border bg-bg-card p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
            <Input label="Address" className="sm:col-span-2" value={form.address_line} onChange={(e) => setForm({ ...form, address_line: e.target.value })} />
            <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={handleSave}>Save Address</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Add New Address
        </Button>
      )}
    </div>
  )
}

function ProfileTab({ userId, name, phone, onSaved }: { userId: string; name: string; phone: string; onSaved: () => void }) {
  const [form, setForm] = useState({ name, phone })
  const [saving, setSaving] = useState(false)

  useEffect(() => setForm({ name, phone }), [name, phone])

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ name: form.name, phone: form.phone }).eq('id', userId)
    setSaving(false)
    if (error) {
      toast('Could not update profile', 'error')
      return
    }
    onSaved()
    toast('Profile updated', 'success')
  }

  return (
    <div className="max-w-md rounded-card border border-border bg-bg-card p-5">
      <div className="flex flex-col gap-3">
        <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Button onClick={handleSave} disabled={saving} className="mt-2">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
