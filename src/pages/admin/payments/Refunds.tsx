import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { useRefundOrder } from '@/hooks/useAdminPayments'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatINR } from '@/lib/formatters'
import { toast } from '@/store/toastStore'
import type { Order } from '@/types/domain'

export default function Refunds() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'refund-eligible-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('payment_status', ['paid', 'refunded'])
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data
    },
  })
  const refundOrder = useRefundOrder()

  const columns: Column<Order>[] = [
    { header: 'Order #', render: (o) => o.order_number },
    { header: 'Customer', render: (o) => o.guest_name || '—' },
    { header: 'Amount', render: (o) => formatINR(o.total) },
    { header: 'Date', render: (o) => formatDate(o.created_at) },
    { header: 'Status', render: (o) => <Badge tone={o.payment_status === 'refunded' ? 'neutral' : 'success'}>{o.payment_status}</Badge> },
    {
      header: 'Actions',
      render: (o) =>
        o.payment_status === 'paid' ? (
          <button
            onClick={async () => {
              if (!confirm(`Mark order #${o.order_number} as refunded? Process the actual refund in your Razorpay dashboard first.`)) return
              await refundOrder.mutateAsync(o.id)
              toast('Order marked as refunded', 'success')
              refetch()
            }}
            className="text-danger hover:underline"
          >
            Mark Refunded
          </button>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-text-primary">Refunds</h1>
      <p className="text-sm text-text-secondary">
        Refunds are processed manually in your Razorpay dashboard. Use this page to record the refund status here.
      </p>
      <DataTable columns={columns} rows={data ?? []} isLoading={isLoading} keyFn={(o) => o.id} />
    </div>
  )
}
