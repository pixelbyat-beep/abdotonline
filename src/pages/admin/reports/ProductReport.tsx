import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { downloadCsv } from '@/lib/csv'
import { formatINR } from '@/lib/formatters'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/Button'

interface Row {
  productId: string
  name: string
  unitsSold: number
  revenue: number
}

export default function ProductReport() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', 'products'],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from('order_items')
        .select('product_id, qty, price, product_name_snapshot, orders!inner(payment_status)')
        .eq('orders.payment_status', 'paid')
      if (error) throw error

      const byProduct: Record<string, Row> = {}
      for (const item of data) {
        const key = item.product_id
        if (!byProduct[key]) byProduct[key] = { productId: key, name: item.product_name_snapshot, unitsSold: 0, revenue: 0 }
        byProduct[key].unitsSold += item.qty
        byProduct[key].revenue += item.qty * Number(item.price)
      }
      return Object.values(byProduct).sort((a, b) => b.revenue - a.revenue)
    },
  })

  const columns: Column<Row>[] = [
    { header: 'Product', render: (r) => r.name },
    { header: 'Units Sold', render: (r) => r.unitsSold },
    { header: 'Revenue', render: (r) => formatINR(r.revenue) },
  ]

  function exportCsv() {
    if (!data) return
    downloadCsv('product-report.csv', data.map((r) => ({ product: r.name, units_sold: r.unitsSold, revenue: r.revenue })))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-text-primary">Product Report</h1>
        <Button variant="outline" onClick={exportCsv}>
          <Download size={15} /> Export CSV
        </Button>
      </div>
      <DataTable columns={columns} rows={data ?? []} isLoading={isLoading} keyFn={(r) => r.productId} />
    </div>
  )
}
