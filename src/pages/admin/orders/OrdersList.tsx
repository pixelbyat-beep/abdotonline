import { useNavigate } from 'react-router-dom'
import { useAdminOrders, type OrderFilter } from '@/hooks/useAdminOrders'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/OrderStatusBadge'
import { formatDate, formatINR } from '@/lib/formatters'
import type { Order } from '@/types/domain'

export function OrdersList({ filter, title }: { filter: OrderFilter; title: string }) {
  const { data: orders, isLoading } = useAdminOrders(filter)
  const navigate = useNavigate()

  const columns: Column<Order>[] = [
    { header: 'Order #', render: (o) => <span className="font-medium">{o.order_number}</span> },
    { header: 'Customer', render: (o) => o.guest_name || '—' },
    { header: 'Delivery', render: (o) => <span className="capitalize">{o.delivery_type}</span> },
    { header: 'Total', render: (o) => formatINR(o.total) },
    { header: 'Payment', render: (o) => <PaymentStatusBadge status={o.payment_status} /> },
    { header: 'Status', render: (o) => <OrderStatusBadge status={o.order_status} /> },
    { header: 'Date', render: (o) => formatDate(o.created_at) },
  ]

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-text-primary">{title}</h1>
      <DataTable
        columns={columns}
        rows={orders ?? []}
        isLoading={isLoading}
        keyFn={(o) => o.id}
        emptyMessage="No orders found."
        onRowClick={(o) => navigate(`/admin/orders/${o.id}`)}
      />
    </div>
  )
}
