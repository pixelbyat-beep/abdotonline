import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge'
import { formatDate, formatINR } from '@/lib/formatters'
import { Badge } from '@/components/ui/Badge'
import type { Order } from '@/types/domain'

export default function CourierList() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'shipping', 'courier'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('delivery_type', 'courier')
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const columns: Column<Order>[] = [
    { header: 'Order #', render: (o) => o.order_number },
    { header: 'Customer', render: (o) => o.guest_name || '—' },
    { header: 'City', render: (o) => `${o.city}, ${o.state}` },
    { header: 'Total', render: (o) => formatINR(o.total) },
    {
      header: 'Tracking',
      render: (o) => (o.tracking_number ? <Badge tone="success">{o.tracking_number}</Badge> : <Badge tone="warning">Not shipped</Badge>),
    },
    { header: 'Status', render: (o) => <OrderStatusBadge status={o.order_status} /> },
    { header: 'Date', render: (o) => formatDate(o.created_at) },
  ]

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-text-primary">Courier Orders</h1>
      <DataTable columns={columns} rows={data ?? []} isLoading={isLoading} keyFn={(o) => o.id} onRowClick={(o) => navigate(`/admin/orders/${o.id}`)} />
    </div>
  )
}
