import { useLicenseKeys } from '@/hooks/useLicenseKeys'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/Badge'
import { maskLicenseKey, formatDate } from '@/lib/formatters'

interface KeyRow {
  id: string
  key_value: string
  status: 'unused' | 'used' | 'expired'
  used_at: string | null
  products: { name: string } | null
  orders: { order_number: string; guest_email: string } | null
}

const TONE = { unused: 'success', used: 'neutral', expired: 'danger' } as const

export default function AllKeys() {
  const { data, isLoading } = useLicenseKeys()

  const columns: Column<KeyRow>[] = [
    { header: 'Product', render: (r) => r.products?.name ?? '—' },
    { header: 'Key', render: (r) => <span className="font-mono text-xs">{maskLicenseKey(r.key_value)}</span> },
    { header: 'Status', render: (r) => <Badge tone={TONE[r.status]}>{r.status}</Badge> },
    { header: 'Order', render: (r) => r.orders?.order_number ?? '—' },
    { header: 'Customer Email', render: (r) => r.orders?.guest_email ?? '—' },
    { header: 'Used At', render: (r) => (r.used_at ? formatDate(r.used_at) : '—') },
  ]

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-text-primary">All License Keys</h1>
      <DataTable columns={columns} rows={(data as unknown as KeyRow[]) ?? []} isLoading={isLoading} keyFn={(r) => r.id} />
    </div>
  )
}
