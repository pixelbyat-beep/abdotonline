import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, ExternalLink, Search, Upload, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { HOME_DEFAULTS, sortByIdOrder, useHomeContent, useSaveHomeContent, type HomeContent } from '@/hooks/useHomeContent'
import { useAdminProductsList } from '@/hooks/useAdminProducts'
import { useAdminCategories } from '@/hooks/useAdminCategories'
import { supabase, publicImageUrl } from '@/lib/supabaseClient'
import { CategoryIcon } from '@/lib/categoryIcons'
import { formatINR } from '@/lib/formatters'
import { toast } from '@/store/toastStore'
import { cn } from '@/lib/cn'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const MAX_IMAGE_MB = 5
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

type SectionKey = 'hero' | 'categories' | 'trending' | 'deals'

const SECTIONS: { key: SectionKey; label: string; hint: string }[] = [
  { key: 'hero', label: 'Hero Banner', hint: 'Big banner + 2 buttons' },
  { key: 'categories', label: 'Categories', hint: 'Category tiles' },
  { key: 'trending', label: 'Trending Software', hint: 'Row of products' },
  { key: 'deals', label: 'Software Deals', hint: 'Discounted products' },
]

interface AdminProduct {
  id: string
  name: string
  brand: string | null
  status: string
  price: number
  discount_pct: number | null
  featured: boolean
  product_images: { storage_path: string; is_primary: boolean }[]
}

function productImage(p: AdminProduct | undefined): string {
  const img = p?.product_images.find((i) => i.is_primary) ?? p?.product_images[0]
  return img ? publicImageUrl(img.storage_path) : ''
}

function Thumb({ product, className }: { product: AdminProduct | undefined; className?: string }) {
  const src = productImage(product)
  return (
    <div className={cn('flex items-center justify-center overflow-hidden rounded-btn bg-white', className)}>
      {src ? <img src={src} alt="" className="h-full w-full object-contain p-1.5" /> : <span className="text-[10px] text-gray-400">No image</span>}
    </div>
  )
}

function StepLabel({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-on-accent">{n}</span>
      <span className="text-sm font-semibold text-text-primary">{children}</span>
    </div>
  )
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (path: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    if (!IMAGE_TYPES.includes(file.type)) return toast('Only JPG, PNG or WEBP images are allowed', 'error')
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) return toast(`Image must be under ${MAX_IMAGE_MB}MB`, 'error')
    setUploading(true)
    const path = `home/${Date.now()}-${file.name.replace(/\s+/g, '-')}`
    const { error } = await supabase.storage.from('store-assets').upload(path, file)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
    if (error) return toast('Failed to upload image', 'error')
    onChange(path)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-text-secondary">{label}</span>
      <div className="aspect-[16/7] overflow-hidden rounded-btn border border-border bg-bg-main">
        {value && <img src={publicImageUrl(value)} alt="" className="h-full w-full object-cover" />}
      </div>
      <input ref={inputRef} type="file" accept={IMAGE_TYPES.join(',')} className="hidden" onChange={(e) => handleFile(e.target.files)} />
      <Button type="button" size="sm" variant="outline" className="w-fit" disabled={uploading} onClick={() => inputRef.current?.click()}>
        <Upload size={14} /> {uploading ? 'Uploading...' : 'Change image'}
      </Button>
    </div>
  )
}

/** Click products to add them — no typing needed. Selected ones appear first, in order, and can be moved or removed. */
function ProductPicker({
  value,
  onChange,
  autoNote,
  limit,
  autoSort,
}: {
  value: string[]
  onChange: (ids: string[]) => void
  autoNote: string
  limit: number
  autoSort: (a: AdminProduct, b: AdminProduct) => number
}) {
  const { data, isLoading } = useAdminProductsList()
  const [query, setQuery] = useState('')
  const products = ((data ?? []) as unknown as AdminProduct[]).filter((p) => p.status === 'active')
  const byId = new Map(products.map((p) => [p.id, p]))
  const selected = value.filter((id) => byId.has(id))
  const q = query.trim().toLowerCase()
  const visible = products.filter((p) => !q || p.name.toLowerCase().includes(q) || (p.brand ?? '').toLowerCase().includes(q))

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...selected]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  const automatic = [...products].sort(autoSort).slice(0, limit)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <StepLabel n={1}>What visitors will see</StepLabel>
        {selected.length === 0 ? (
          <div className="rounded-btn border border-dashed border-border bg-bg-main p-4">
            <p className="text-sm text-text-primary">Automatic mode</p>
            <p className="mt-0.5 text-xs text-text-secondary">{autoNote} Click products below to choose them yourself instead.</p>
            {automatic.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto opacity-70">
                {automatic.map((p) => (
                  <Thumb key={p.id} product={p} className="h-16 w-16 shrink-0 border border-border" />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {selected.map((id, i) => {
                const p = byId.get(id)!
                return (
                  <div key={id} className="relative rounded-btn border border-accent/50 bg-bg-main p-2">
                    <span className="absolute top-1 left-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-on-accent">{i + 1}</span>
                    <Thumb product={p} className="aspect-square w-full" />
                    <p className="mt-1.5 truncate text-xs font-medium text-text-primary">{p.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-text-secondary hover:bg-bg-elevated hover:text-accent disabled:opacity-30" aria-label="Move earlier">
                        <ArrowLeft size={14} />
                      </button>
                      <button type="button" onClick={() => toggle(id)} className="rounded p-1 text-text-secondary hover:bg-bg-elevated hover:text-danger" aria-label="Remove">
                        <X size={14} />
                      </button>
                      <button type="button" onClick={() => move(i, 1)} disabled={i === selected.length - 1} className="rounded p-1 text-text-secondary hover:bg-bg-elevated hover:text-accent disabled:opacity-30" aria-label="Move later">
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>
                {selected.length} chosen{selected.length > limit && ` — only the first ${limit} will show (raise "Max products" to show more)`}
              </span>
              <button type="button" onClick={() => onChange([])} className="underline hover:text-accent">
                Clear &amp; go back to automatic
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <StepLabel n={2}>Click a product to add or remove it</StepLabel>
        <div className="relative">
          <Search size={15} className="absolute top-1/2 left-3 z-10 -translate-y-1/2 text-text-muted" />
          <Input placeholder="Filter list (optional)" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        {isLoading && <p className="text-xs text-text-muted">Loading products...</p>}
        {!isLoading && visible.length === 0 && <p className="text-xs text-text-muted">No active products found.</p>}
        <div className="grid max-h-[420px] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4">
          {visible.map((p) => {
            const on = value.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className={cn(
                  'relative rounded-btn border bg-bg-main p-2 text-left transition-colors',
                  on ? 'border-accent ring-1 ring-accent' : 'border-border hover:border-accent/60',
                )}
              >
                {on && (
                  <span className="absolute top-1 right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-on-accent">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
                <Thumb product={p} className="aspect-square w-full" />
                <p className="mt-1.5 truncate text-xs font-medium text-text-primary">{p.name}</p>
                <p className="text-[11px] text-text-secondary">
                  {formatINR(p.price)}
                  {!!p.discount_pct && <span className="ml-1 text-success">{p.discount_pct}% off</span>}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** Tiles that look like the storefront; click the eye to hide/show, arrows to reorder. */
function CategoryManager({
  content,
  onChange,
}: {
  content: HomeContent['categories']
  onChange: (values: Partial<HomeContent['categories']>) => void
}) {
  const { data } = useAdminCategories()
  const active = (data ?? []).filter((c) => c.status === 'active')
  const ordered = sortByIdOrder(active, content.order)

  function toggle(id: string) {
    const hidden = content.hiddenIds
    onChange({ hiddenIds: hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id] })
  }

  function move(index: number, dir: -1 | 1) {
    const ids = ordered.map((c) => c.id)
    const target = index + dir
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    onChange({ order: ids })
  }

  return (
    <div className="flex flex-col gap-2">
      <StepLabel n={1}>Arrange your categories</StepLabel>
      <p className="text-xs text-text-secondary">Use the arrows to reorder and the eye to hide a category from the home page.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {ordered.map((c, i) => {
          const hidden = content.hiddenIds.includes(c.id)
          return (
            <div key={c.id} className={cn('rounded-card border border-border bg-bg-main p-3 text-center', hidden && 'opacity-40')}>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-bg-card text-text-secondary">
                <CategoryIcon icon={c.icon} size={24} />
              </div>
              <p className="mt-2 truncate text-sm font-medium text-text-primary">{c.name}</p>
              <div className="mt-2 flex items-center justify-between">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-text-secondary hover:bg-bg-elevated hover:text-accent disabled:opacity-30" aria-label="Move earlier">
                  <ArrowLeft size={14} />
                </button>
                <button type="button" onClick={() => toggle(c.id)} className="rounded p-1 text-text-secondary hover:bg-bg-elevated hover:text-accent" aria-label={hidden ? 'Show' : 'Hide'}>
                  {hidden ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === ordered.length - 1} className="rounded p-1 text-text-secondary hover:bg-bg-elevated hover:text-accent disabled:opacity-30" aria-label="Move later">
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-text-muted">
        Need a new category, icon or name? <Link to="/admin/products/categories" className="text-accent underline">Open Catalog → Categories</Link>.
      </p>
    </div>
  )
}

function HeroPreview({ hero }: { hero: HomeContent['hero'] }) {
  return (
    <div className="relative overflow-hidden rounded-card border border-border bg-bg-main">
      <img src={publicImageUrl(hero.imageDark)} alt="" className="absolute inset-0 hidden h-full w-full object-cover dark:block" />
      <img src={publicImageUrl(hero.imageLight)} alt="" className="absolute inset-0 block h-full w-full object-cover dark:hidden" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg-main via-bg-main/60 to-transparent" />
      <div className="relative p-6 sm:p-8">
        {hero.badge && <span className="inline-block rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent">{hero.badge}</span>}
        <h3 className="mt-2 max-w-xs text-lg leading-tight font-bold whitespace-pre-line text-text-primary sm:text-xl">{hero.title || 'Heading'}</h3>
        {hero.subtitle && <p className="mt-1.5 max-w-xs text-xs text-text-secondary">{hero.subtitle}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {hero.primaryLabel && <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-on-accent">{hero.primaryLabel}</span>}
          {hero.secondaryEnabled && hero.secondaryLabel && (
            <span className="rounded-full border border-border px-3 py-1 text-[11px] text-text-primary">{hero.secondaryLabel}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function HomePageEditor() {
  const { data: saved, isPlaceholderData } = useHomeContent()
  const save = useSaveHomeContent()
  const [form, setForm] = useState<HomeContent>(HOME_DEFAULTS)
  const [active, setActive] = useState<SectionKey>('hero')
  const loaded = useRef(false)

  // placeholderData (the defaults) is returned before the fetch finishes, so wait for the real value.
  useEffect(() => {
    if (saved && !isPlaceholderData && !loaded.current) {
      loaded.current = true
      setForm(saved)
    }
  }, [saved, isPlaceholderData])

  function patch<K extends keyof HomeContent>(key: K, values: Partial<HomeContent[K]>) {
    setForm((f) => ({ ...f, [key]: { ...f[key], ...values } }))
  }

  async function handleSave() {
    if (!loaded.current) return toast('Still loading — try again in a moment', 'error')
    if (form.hero.enabled && !form.hero.title.trim()) return toast('Hero heading cannot be empty', 'error')
    const clamp = (n: number) => Math.min(12, Math.max(1, Math.round(n) || 4))
    const next: HomeContent = {
      ...form,
      trending: { ...form.trending, limit: clamp(form.trending.limit) },
      deals: { ...form.deals, limit: clamp(form.deals.limit) },
    }
    try {
      await save.mutateAsync(next)
      setForm(next)
      toast('Home page updated', 'success')
    } catch {
      toast('Could not save home page changes', 'error')
    }
  }

  const { hero, trending, deals } = form
  const enabled = (k: SectionKey) => form[k].enabled
  const current = SECTIONS.find((s) => s.key === active)!

  return (
    <div className="max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Home Page</h1>
          <p className="mt-0.5 text-sm text-text-secondary">Pick a section on the left, edit it on the right, then press Save.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/" target="_blank">
            <Button variant="outline" size="sm">
              <ExternalLink size={14} /> View store
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={save.isPending}>
            {save.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        {/* Page map: mirrors the storefront top-to-bottom */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-card border border-border bg-bg-card p-3">
            <p className="mb-2 px-1 text-[11px] font-semibold tracking-wide text-text-muted uppercase">Your home page</p>
            <div className="flex flex-col gap-2 rounded-btn bg-bg-main p-2">
              <div className="rounded border border-dashed border-border px-2 py-1.5 text-center text-[11px] text-text-muted">Navbar (fixed)</div>
              {SECTIONS.map((s) => (
                <div
                  key={s.key}
                  className={cn(
                    'flex items-center gap-2 rounded-btn border px-3 py-2.5 transition-colors',
                    active === s.key ? 'border-accent bg-accent/10' : 'border-border bg-bg-card hover:border-accent/50',
                    s.key === 'hero' && 'py-5',
                    !enabled(s.key) && 'opacity-50',
                  )}
                >
                  <button type="button" onClick={() => setActive(s.key)} className="min-w-0 flex-1 text-left">
                    <p className={cn('truncate text-sm font-semibold', active === s.key ? 'text-accent' : 'text-text-primary')}>{s.label}</p>
                    <p className="truncate text-[11px] text-text-secondary">{enabled(s.key) ? s.hint : 'Hidden'}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => patch(s.key, { enabled: !enabled(s.key) } as never)}
                    className="shrink-0 rounded p-1.5 text-text-secondary hover:bg-bg-elevated hover:text-accent"
                    aria-label={enabled(s.key) ? `Hide ${s.label}` : `Show ${s.label}`}
                    title={enabled(s.key) ? 'Click to hide' : 'Click to show'}
                  >
                    {enabled(s.key) ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              ))}
              <div className="rounded border border-dashed border-border px-2 py-1.5 text-center text-[11px] text-text-muted">Trust badges &amp; footer (fixed)</div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 rounded-card border border-border bg-bg-card">
          <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="font-semibold text-text-primary">{current.label}</h2>
              <p className="text-xs text-text-secondary">{enabled(active) ? 'Visible on the home page' : 'Currently hidden — turn it on with the eye icon on the left'}</p>
            </div>
          </header>

          <div className="flex flex-col gap-5 p-5">
            {active === 'hero' && (
              <>
                <HeroPreview hero={hero} />
                <Input label="Badge text (leave empty to hide)" value={hero.badge} onChange={(e) => patch('hero', { badge: e.target.value })} />
                <Textarea label="Heading (press Enter for a new line)" rows={2} value={hero.title} onChange={(e) => patch('hero', { title: e.target.value })} />
                <Textarea label="Sub-heading" rows={2} value={hero.subtitle} onChange={(e) => patch('hero', { subtitle: e.target.value })} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Button 1 text" value={hero.primaryLabel} onChange={(e) => patch('hero', { primaryLabel: e.target.value })} />
                  <Input label="Button 1 link" value={hero.primaryLink} onChange={(e) => patch('hero', { primaryLink: e.target.value })} placeholder="/listing" />
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
                  <input type="checkbox" checked={hero.secondaryEnabled} onChange={(e) => patch('hero', { secondaryEnabled: e.target.checked })} className="h-4 w-4" />
                  Show a second button
                </label>
                {hero.secondaryEnabled && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Button 2 text" value={hero.secondaryLabel} onChange={(e) => patch('hero', { secondaryLabel: e.target.value })} />
                    <Input label="Button 2 link" value={hero.secondaryLink} onChange={(e) => patch('hero', { secondaryLink: e.target.value })} placeholder="/listing?filter=deals" />
                  </div>
                )}
                <p className="-mt-2 text-xs text-text-muted">Links: /listing = all products, /listing?filter=deals = deals, /listing?category=antivirus = one category.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ImageField label="Background — light theme" value={hero.imageLight} onChange={(p) => patch('hero', { imageLight: p })} />
                  <ImageField label="Background — dark theme" value={hero.imageDark} onChange={(p) => patch('hero', { imageDark: p })} />
                </div>
                <button
                  type="button"
                  className="w-fit text-xs text-text-secondary underline hover:text-accent"
                  onClick={() => patch('hero', { imageLight: HOME_DEFAULTS.hero.imageLight, imageDark: HOME_DEFAULTS.hero.imageDark })}
                >
                  Reset backgrounds to default
                </button>
              </>
            )}

            {active === 'categories' && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Section title" value={form.categories.title} onChange={(e) => patch('categories', { title: e.target.value })} />
                  <Input label="Section subtitle" value={form.categories.subtitle} onChange={(e) => patch('categories', { subtitle: e.target.value })} />
                </div>
                <CategoryManager content={form.categories} onChange={(v) => patch('categories', v)} />
              </>
            )}

            {active === 'trending' && (
              <>
                <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
                  <Input label="Section title" value={trending.title} onChange={(e) => patch('trending', { title: e.target.value })} />
                  <Input label="Max products (1–12)" type="number" min={1} max={12} value={trending.limit} onChange={(e) => patch('trending', { limit: Number(e.target.value) })} />
                </div>
                <ProductPicker
                  value={trending.productIds}
                  onChange={(ids) => patch('trending', { productIds: ids })}
                  limit={trending.limit}
                  autoNote="Showing products marked “Featured”."
                  autoSort={(a, b) => Number(b.featured) - Number(a.featured)}
                />
              </>
            )}

            {active === 'deals' && (
              <>
                <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
                  <Input label="Section title" value={deals.title} onChange={(e) => patch('deals', { title: e.target.value })} />
                  <Input label="Max products (1–12)" type="number" min={1} max={12} value={deals.limit} onChange={(e) => patch('deals', { limit: Number(e.target.value) })} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Section subtitle" value={deals.subtitle} onChange={(e) => patch('deals', { subtitle: e.target.value })} />
                  <Input label="Button text" value={deals.buttonLabel} onChange={(e) => patch('deals', { buttonLabel: e.target.value })} />
                </div>
                <ProductPicker
                  value={deals.productIds}
                  onChange={(ids) => patch('deals', { productIds: ids })}
                  limit={deals.limit}
                  autoNote="Showing the products with the biggest discounts."
                  autoSort={(a, b) => (b.discount_pct ?? 0) - (a.discount_pct ?? 0)}
                />
              </>
            )}
          </div>

          <footer className="flex justify-end border-t border-border px-5 py-4">
            <Button onClick={handleSave} disabled={save.isPending}>
              {save.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </footer>
        </div>
      </div>
    </div>
  )
}
