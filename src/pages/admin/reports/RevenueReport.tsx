import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { downloadCsv } from '@/lib/csv'
import { formatINR } from '@/lib/formatters'
import { Button } from '@/components/ui/Button'

export default function RevenueReport() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', 'revenue'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('total, delivery_charge, discount_amount, created_at').eq('payment_status', 'paid')
      if (error) throw error

      const byMonth: Record<string, { revenue: number; orders: number; delivery: number; discount: number }> = {}
      for (const o of data) {
        const key = o.created_at.slice(0, 7)
        if (!byMonth[key]) byMonth[key] = { revenue: 0, orders: 0, delivery: 0, discount: 0 }
        byMonth[key].revenue += Number(o.total)
        byMonth[key].orders += 1
        byMonth[key].delivery += Number(o.delivery_charge)
        byMonth[key].discount += Number(o.discount_amount)
      }
      return Object.entries(byMonth)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([month, v]) => ({ month, ...v }))
    },
  })

  function exportCsv() {
    if (!data) return
    downloadCsv('revenue-report.csv', data.map((d) => ({ month: d.month, revenue: d.revenue, orders: d.orders, delivery_charges: d.delivery, discounts: d.discount })))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-text-primary">Revenue Report</h1>
        <Button variant="outline" onClick={exportCsv}>
          <Download size={15} /> Export CSV
        </Button>
      </div>
      {isLoading && <p className="text-text-secondary">Loading...</p>}
      <div className="overflow-x-auto rounded-card border border-border bg-bg-card">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Revenue</th>
              <th className="px-4 py-3">Delivery Charges</th>
              <th className="px-4 py-3">Discounts Given</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((row) => (
              <tr key={row.month} className="border-b border-border text-text-primary last:border-0">
                <td className="px-4 py-3">{row.month}</td>
                <td className="px-4 py-3">{row.orders}</td>
                <td className="px-4 py-3">{formatINR(row.revenue)}</td>
                <td className="px-4 py-3">{formatINR(row.delivery)}</td>
                <td className="px-4 py-3">{formatINR(row.discount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
