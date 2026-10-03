import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAdminProduct, useSaveProduct } from '@/hooks/useAdminProducts'
import { useAdminCategories } from '@/hooks/useAdminCategories'
import { slugify } from '@/lib/formatters'
import { toast } from '@/store/toastStore'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { Mail, Truck, Layers, Save, Rocket, Tag, IndianRupee, Image as ImageIcon, Box, KeyRound } from 'lucide-react'
import { cn } from '@/lib/cn'

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
  weight_kg: '0.5',
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
        weight_kg: String(product.weight_kg ?? 0.5),
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

  async function handleSave(statusOverride?: 'active' | 'inactive') {
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
        weight_kg: Number(form.weight_kg) || 0,
        status: statusOverride ?? form.status,
        featured: form.featured,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
      })
      if (statusOverride) update('status', statusOverride)
      toast(statusOverride === 'inactive' ? 'Draft saved' : 'Product saved', 'success')
      if (isNew) navigate(`/admin/products/${savedId}`)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save product', 'error')
    } finally {
      setSaving(false)
    }
  }

  const price = Number(form.price) || 0
  const mrp = Number(form.original_price) || 0
  const discountPct = mrp > price && price > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0
  const isDigital = form.delivery_type === 'email' || form.delivery_type === 'both'
  const isPhysical = form.delivery_type === 'courier' || form.delivery_type === 'both'

  const card = 'flex flex-col gap-4 rounded-card bg-bg-card p-5 shadow-[0_1px_3px_rgba(11,28,48,0.06)]'
  const sectionTitle = (icon: React.ReactNode, title: string, hint?: string) => (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">{icon}</span>
      <div>
        <h2 className="text-base font-bold text-text-primary">{title}</h2>
        {hint && <p className="text-xs text-text-secondary">{hint}</p>}
      </div>
    </div>
  )

  const TYPES = [
    { value: 'email' as const, title: 'Digital Software / Key', hint: 'Auto-provisioned license codes, zero physical handling.', badge: '₹0 Shipping', icon: Mail },
    { value: 'courier' as const, title: 'Physical Hardware', hint: 'Parcel packing, weight-based courier rates.', badge: 'Weight-based', icon: Truck },
    { value: 'both' as const, title: 'Hybrid / Bundle', hint: 'Digital activation token plus a tracked courier kit.', badge: 'Digital + Physical', icon: Layers },
  ]

  return (
    <div className="mx-auto max-w-3xl pb-28">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Catalog &rsaquo; Products &rsaquo; {isNew ? 'Add New Product' : 'Edit'}</p>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">{isNew ? 'Add New Product' : 'Edit Product'}</h1>
        <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', form.status === 'active' ? 'bg-success/10 text-success' : 'bg-bg-elevated text-text-secondary')}>
          {form.status === 'active' ? 'Live' : 'Draft'}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <section className={card}>
          {sectionTitle(<Layers size={18} />, 'Product Classification', 'Configures auto-provisioning and logistics')}
          <div className="flex flex-col gap-2.5">
            {TYPES.map((t) => {
              const active = form.delivery_type === t.value
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => update('delivery_type', t.value)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-colors',
                    active ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/40',
                  )}
                >
                  <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', active ? 'border-accent' : 'border-border')}>
                    {active && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
                  </span>
                  <t.icon size={20} className="shrink-0 text-accent" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-text-primary">{t.title}</span>
                    <span className="block text-xs text-text-secondary">{t.hint}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">{t.badge}</span>
                </button>
              )
            })}
          </div>
        </section>

        {isDigital && (
          <section className={card}>
            {sectionTitle(<KeyRound size={18} />, 'Digital License Settings', 'Keys are added under License Keys → Add Keys')}
            <Input label="License Info" placeholder="1 Device | 1 Year" value={form.license_info} onChange={(e) => update('license_info', e.target.value)} />
          </section>
        )}

        {isPhysical && (
          <section className={card}>
            {sectionTitle(<Box size={18} />, 'Physical Dispatch Logistics', 'Weight drives the courier charge at checkout')}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Weight (kg, per unit)"
                type="number"
                step="0.01"
                min="0"
                value={form.weight_kg}
                onChange={(e) => update('weight_kg', e.target.value)}
              />
              <Input label="Stock Quantity" type="number" value={form.stock_qty} onChange={(e) => update('stock_qty', e.target.value)} />
            </div>
          </section>
        )}

        <section className={card}>
          {sectionTitle(<Tag size={18} />, 'Product Identity')}
          <Input label="Product Title" value={form.name} onChange={(e) => update('name', e.target.value)} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Brand" value={form.brand} onChange={(e) => update('brand', e.target.value)} />
            <Select label="Category" value={form.category_id} onChange={(e) => update('category_id', e.target.value)}>
              <option value="">Select category</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <Textarea label="Summary Overview" rows={4} value={form.description} onChange={(e) => update('description', e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-text-primary">
            <input type="checkbox" checked={form.featured} onChange={(e) => update('featured', e.target.checked)} className="accent-accent" />
            Featured on homepage
          </label>
        </section>

        <section className={card}>
          <div className="flex items-start justify-between gap-2">
            {sectionTitle(<IndianRupee size={18} />, 'Pricing & Margins')}
            {discountPct > 0 && <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">{discountPct}% OFF</span>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Original MRP (₹)" type="number" value={form.original_price} onChange={(e) => update('original_price', e.target.value)} />
            <Input label="Selling Price (₹)" type="number" value={form.price} onChange={(e) => update('price', e.target.value)} />
          </div>
          {!isPhysical && <Input label="Stock Quantity" type="number" value={form.stock_qty} onChange={(e) => update('stock_qty', e.target.value)} />}
        </section>

        <section className={card}>
          {sectionTitle(<ImageIcon size={18} />, 'Product Imagery', 'High resolution catalog photos')}
          {!isNew && product ? (
            <ImageUploader productId={product.id} images={product.product_images} onChange={refetch} />
          ) : (
            <p className="text-sm text-text-secondary">Save the product first to upload images.</p>
          )}
        </section>

        <section className={card}>
          {sectionTitle(<Tag size={18} />, 'SEO')}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Meta Title" value={form.meta_title} onChange={(e) => update('meta_title', e.target.value)} />
            <Input label="Meta Description" value={form.meta_description} onChange={(e) => update('meta_description', e.target.value)} />
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-[60px] z-20 border-t border-border bg-bg-card/95 px-4 py-3 backdrop-blur md:bottom-0 md:left-64">
        <div className="mx-auto flex max-w-3xl gap-3">
          <button
            onClick={() => handleSave('inactive')}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-bg-elevated px-4 py-3 text-sm font-semibold text-text-primary hover:bg-border disabled:opacity-50"
          >
            <Save size={16} /> Save Draft
          </button>
          <button
            onClick={() => handleSave('active')}
            disabled={saving}
            className="flex flex-[1.6] items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent shadow-sm hover:bg-accent-dark disabled:opacity-50"
          >
            <Rocket size={16} /> {saving ? 'Saving...' : 'Publish Live'}
          </button>
        </div>
      </div>
    </div>
  )
}
