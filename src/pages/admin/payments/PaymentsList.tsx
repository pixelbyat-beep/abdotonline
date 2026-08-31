import { useAdminPayments, type PaymentFilter } from '@/hooks/useAdminPayments'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatINR } from '@/lib/formatters'

interface Row {
  id: string
  order_number: string
  amount: number
  method: string
  status: string
  created_at: string
}

const TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  paid: 'success',
  created: 'warning',
  pending: 'warning',
  failed: 'danger',
  refunded: 'neutral',
}

export function PaymentsList({ filter, title }: { filter: PaymentFilter; title: string }) {
  const { data, isLoading } = useAdminPayments(filter)

  const columns: Column<Row>[] = [
    { header: 'Order #', render: (r) => r.order_number },
    { header: 'Amount', render: (r) => formatINR(r.amount) },
    { header: 'Method', render: (r) => <span className="uppercase text-xs">{r.method}</span> },
    { header: 'Status', render: (r) => <Badge tone={TONE[r.status] ?? 'neutral'}>{r.status}</Badge> },
    { header: 'Date', render: (r) => formatDate(r.created_at) },
  ]

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-text-primary">{title}</h1>
      <DataTable columns={columns} rows={data ?? []} isLoading={isLoading} keyFn={(r) => r.id} />
    </div>
  )
}
