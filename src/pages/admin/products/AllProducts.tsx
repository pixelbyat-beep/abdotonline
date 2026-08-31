import { Link, useNavigate } from 'react-router-dom'
import { Plus, ImageOff } from 'lucide-react'
import { useAdminProductsList, useSaveProduct, useDeleteProduct } from '@/hooks/useAdminProducts'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatINR } from '@/lib/formatters'
import { publicImageUrl } from '@/lib/supabaseClient'
import type { ProductImage } from '@/types/domain'

interface Row {
  id: string
  name: string
  brand: string | null
  price: number
  stock_qty: number
  status: 'active' | 'inactive'
  featured: boolean
  categories: { name: string } | null
  product_images: ProductImage[]
}

export default function AllProducts() {
  const { data, isLoading } = useAdminProductsList()
  const saveProduct = useSaveProduct()
  const deleteProduct = useDeleteProduct()
  const navigate = useNavigate()

  const columns: Column<Row>[] = [
    {
      header: 'Image',
      render: (r) => {
        const image = r.product_images.find((i) => i.is_primary) ?? r.product_images[0]
        return image ? (
          <img src={publicImageUrl(image.storage_path)} alt="" className="h-11 w-11 rounded-btn bg-bg-elevated object-contain p-0.5" />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-btn bg-bg-elevated text-text-muted">
            <ImageOff size={16} />
          </div>
        )
      },
    },
    { header: 'Name', render: (r) => r.name },
    { header: 'Brand', render: (r) => r.brand ?? '—' },
    { header: 'Category', render: (r) => r.categories?.name ?? '—' },
    { header: 'Price', render: (r) => formatINR(r.price) },
    { header: 'Stock', render: (r) => r.stock_qty },
    { header: 'Status', render: (r) => <Badge tone={r.status === 'active' ? 'success' : 'neutral'}>{r.status}</Badge> },
    {
      header: 'Featured',
      render: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            saveProduct.mutate({ id: r.id, featured: !r.featured })
          }}
        >
          <Badge tone={r.featured ? 'accent' : 'neutral'}>{r.featured ? 'Yes' : 'No'}</Badge>
        </button>
      ),
    },
    {
      header: 'Actions',
      render: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (confirm(`Delete ${r.name}?`)) deleteProduct.mutate(r.id)
          }}
          className="text-danger hover:underline"
        >
          Delete
        </button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">All Products</h1>
        <Link to="/admin/products/new">
          <Button><Plus size={15} /> Add Product</Button>
        </Link>
      </div>
      <DataTable
        columns={columns}
        rows={(data as unknown as Row[]) ?? []}
        isLoading={isLoading}
        keyFn={(r) => r.id}
        onRowClick={(r) => navigate(`/admin/products/${r.id}`)}
      />
    </div>
  )
}
