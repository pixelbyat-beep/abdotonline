import { useSettings } from '@/hooks/useSettings'
import { useLowStockProducts } from '@/hooks/useLicenseKeys'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/Badge'

interface Row {
  id: string
  name: string
  brand: string | null
  unusedCount: number
}

export default function LowStock() {
  const { data: settings } = useSettings()
  const { data, isLoading } = useLowStockProducts(settings?.low_stock_threshold ?? 10)

  const columns: Column<Row>[] = [
    { header: 'Product', render: (r) => r.name },
    { header: 'Brand', render: (r) => r.brand ?? '—' },
    { header: 'Unused Keys', render: (r) => <Badge tone="danger">{r.unusedCount}</Badge> },
  ]

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-text-primary">Low Stock Alerts</h1>
      <p className="text-sm text-text-secondary">Products with fewer than {settings?.low_stock_threshold ?? 10} unused license keys.</p>
      <DataTable columns={columns} rows={data ?? []} isLoading={isLoading} keyFn={(r) => r.id} emptyMessage="All products are well stocked." />
    </div>
  )
}
