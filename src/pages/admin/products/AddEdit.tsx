import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAdminProduct, useSaveProduct } from '@/hooks/useAdminProducts'
import { useAdminCategories } from '@/hooks/useAdminCategories'
import { slugify } from '@/lib/formatters'
import { toast } from '@/store/toastStore'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ImageUploader } from '@/components/admin/ImageUploader'

const EMPTY_FORM = {
  name: '',
  brand: '',
  category_id: '',
  description: '',
  price: '',
  original_price: '',
  delivery_type: 'email' as 'email' | 'courier' | 'both',
  license_info: '',
  stock_qty: '0',
  status: 'active' as 'active' | 'inactive',
  featured: false,
  meta_title: '',
  meta_description: '',
}

export default function ProductAddEdit() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const { data: product, refetch } = useAdminProduct(id)
  const { data: categories } = useAdminCategories()
  const saveProduct = useSaveProduct()
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        brand: product.brand ?? '',
        category_id: product.category_id ?? '',
        description: product.description ?? '',
        price: String(product.price),
        original_price: product.original_price ? String(product.original_price) : '',
        delivery_type: product.delivery_type,
        license_info: product.license_info ?? '',
        stock_qty: String(product.stock_qty),
        status: product.status,
        featured: product.featured,
        meta_title: product.meta_title ?? '',
        meta_description: product.meta_description ?? '',
      })
    }
  }, [product])

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price) {
      toast('Name and price are required', 'error')
      return
    }
    setSaving(true)
    try {
      const savedId = await saveProduct.mutateAsync({
        id: isNew ? undefined : id,
        name: form.name,
        slug: slugify(form.name),
        brand: form.brand || null,
        category_id: form.category_id || null,
        description: form.description || null,
        price: Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : null,
        delivery_type: form.delivery_type,
        license_info: form.license_info || null,
        stock_qty: Number(form.stock_qty),
        status: form.status,
        featured: form.featured,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
      })
      toast('Product saved', 'success')
      if (isNew) navigate(`/admin/products/${savedId}`)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save product', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-xl font-bold text-text-primary">{isNew ? 'Add New Product' : 'Edit Product'}</h1>

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Product Name" value={form.name} onChange={(e) => update('name', e.target.value)} />
          <Input label="Brand" value={form.brand} onChange={(e) => update('brand', e.target.value)} />
          <Select label="Category" value={form.category_id} onChange={(e) => update('category_id', e.target.value)}>
            <option value="">Select category</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select label="Delivery Type" value={form.delivery_type} onChange={(e) => update('delivery_type', e.target.value as typeof form.delivery_type)}>
            <option value="email">Email</option>
            <option value="courier">Courier</option>
            <option value="both">Both</option>
          </Select>
          <Input label="Price (₹)" type="number" value={form.price} onChange={(e) => update('price', e.target.value)} />
          <Input label="Original / MRP Price (₹)" type="number" value={form.original_price} onChange={(e) => update('original_price', e.target.value)} />
          <Input label="License Info" placeholder="1 Device | 1 Year" value={form.license_info} onChange={(e) => update('license_info', e.target.value)} />
          <Input label="Stock Quantity" type="number" value={form.stock_qty} onChange={(e) => update('stock_qty', e.target.value)} />
          <Select label="Status" value={form.status} onChange={(e) => update('status', e.target.value as typeof form.status)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-text-primary">
            <input type="checkbox" checked={form.featured} onChange={(e) => update('featured', e.target.checked)} className="accent-accent" />
            Featured on homepage
          </label>
        </div>

        <Textarea label="Description" rows={4} value={form.description} onChange={(e) => update('description', e.target.value)} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Meta Title (SEO)" value={form.meta_title} onChange={(e) => update('meta_title', e.target.value)} />
          <Input label="Meta Description (SEO)" value={form.meta_description} onChange={(e) => update('meta_description', e.target.value)} />
        </div>

        {!isNew && product && (
          <div>
            <p className="mb-2 text-sm font-semibold text-text-primary">Product Images</p>
            <ImageUploader productId={product.id} images={product.product_images} onChange={refetch} />
          </div>
        )}
        {isNew && <p className="text-sm text-text-secondary">Save the product first to upload images.</p>}

        <Button onClick={handleSave} disabled={saving} className="w-fit">
          {saving ? 'Saving...' : 'Save Product'}
        </Button>
      </div>
    </div>
  )
}
