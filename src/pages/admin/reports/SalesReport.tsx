import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { downloadCsv } from '@/lib/csv'
import { formatDate, formatINR } from '@/lib/formatters'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Order } from '@/types/domain'

export default function SalesReport() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', 'sales', from, to],
    queryFn: async () => {
      let query = supabase.from('orders').select('*').eq('payment_status', 'paid').order('created_at', { ascending: false })
      if (from) query = query.gte('created_at', from)
      if (to) query = query.lte('created_at', `${to}T23:59:59`)
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })

  const columns: Column<Order>[] = [
    { header: 'Order #', render: (o) => o.order_number },
    { header: 'Customer', render: (o) => o.guest_name || '—' },
    { header: 'Delivery', render: (o) => o.delivery_type },
    { header: 'Total', render: (o) => formatINR(o.total) },
    { header: 'Date', render: (o) => formatDate(o.created_at) },
  ]

  function exportCsv() {
    if (!data) return
    downloadCsv(
      'sales-report.csv',
      data.map((o) => ({ order_number: o.order_number, customer: o.guest_name ?? '', delivery: o.delivery_type, total: o.total, date: o.created_at })),
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-text-primary">Sales Report</h1>
        <Button variant="outline" onClick={exportCsv}>
          <Download size={15} /> Export CSV
        </Button>
      </div>
      <div className="flex flex-wrap gap-3">
        <Input type="date" label="From" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" label="To" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <p className="text-sm text-text-secondary">
        {data ? `${data.length} paid orders — total ${formatINR(data.reduce((s, o) => s + Number(o.total), 0))}` : ''}
      </p>
      <DataTable columns={columns} rows={data ?? []} isLoading={isLoading} keyFn={(o) => o.id} />
    </div>
  )
}
