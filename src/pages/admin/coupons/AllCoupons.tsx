import { useState } from 'react'
import { useAdminCoupons, useSaveCoupon, useDeleteCoupon } from '@/hooks/useAdminCoupons'
import { toast } from '@/store/toastStore'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/formatters'
import type { Coupon } from '@/types/domain'

const EMPTY = { code: '', type: 'percent' as 'percent' | 'fixed', value: '', min_order: '0', max_uses: '' }

export default function AllCoupons() {
  const { data, isLoading } = useAdminCoupons()
  const saveCoupon = useSaveCoupon()
  const deleteCoupon = useDeleteCoupon()
  const [form, setForm] = useState(EMPTY)

  async function handleAdd() {
    if (!form.code.trim() || !form.value) {
      toast('Coupon code and value are required', 'error')
      return
    }
    await saveCoupon.mutateAsync({
      code: form.code.toUpperCase(),
      type: form.type,
      value: Number(form.value),
      min_order: Number(form.min_order || 0),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      status: 'active',
    })
    setForm(EMPTY)
    toast('Coupon added', 'success')
  }

  const columns: Column<Coupon>[] = [
    { header: 'Code', render: (c) => <span className="font-mono font-semibold">{c.code}</span> },
    { header: 'Type', render: (c) => (c.type === 'percent' ? `${c.value}%` : `₹${c.value}`) },
    { header: 'Min Order', render: (c) => `₹${c.min_order}` },
    { header: 'Usage', render: (c) => `${c.used_count}${c.max_uses ? ` / ${c.max_uses}` : ''}` },
    { header: 'Created', render: (c) => formatDate(c.created_at) },
    {
      header: 'Status',
      render: (c) => (
        <button onClick={() => saveCoupon.mutate({ id: c.id, status: c.status === 'active' ? 'inactive' : 'active' })}>
          <Badge tone={c.status === 'active' ? 'success' : 'neutral'}>{c.status}</Badge>
        </button>
      ),
    },
    {
      header: 'Actions',
      render: (c) => (
        <button onClick={() => confirm(`Delete coupon ${c.code}?`) && deleteCoupon.mutate(c.id)} className="text-danger hover:underline">
          Delete
        </button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-text-primary">Coupons & Deals</h1>

      <div className="rounded-card border border-border bg-bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-text-primary">Add Coupon</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Input placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'percent' | 'fixed' })}>
            <option value="percent">Percent %</option>
            <option value="fixed">Fixed ₹</option>
          </Select>
          <Input placeholder="Value" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          <Input placeholder="Min Order ₹" type="number" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} />
          <Input placeholder="Max Uses" type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} />
        </div>
        <Button onClick={handleAdd} className="mt-3">Add Coupon</Button>
      </div>

      <DataTable columns={columns} rows={data ?? []} isLoading={isLoading} keyFn={(c) => c.id} />
    </div>
  )
}
