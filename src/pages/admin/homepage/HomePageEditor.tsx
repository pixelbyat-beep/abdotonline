import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ExternalLink, Search, Upload, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { HOME_DEFAULTS, useHomeContent, useSaveHomeContent, type HomeContent } from '@/hooks/useHomeContent'
import { useAdminProductsList } from '@/hooks/useAdminProducts'
import { useAdminCategories } from '@/hooks/useAdminCategories'
import { supabase, publicImageUrl } from '@/lib/supabaseClient'
import { toast } from '@/store/toastStore'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const MAX_IMAGE_MB = 5
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function Section({
  title,
  hint,
  enabled,
  onToggle,
  children,
}: {
  title: string
  hint: string
  enabled: boolean
  onToggle: (v: boolean) => void
  children: ReactNode
}) {
  return (
    <section className="rounded-card border border-border bg-bg-card">
      <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-semibold text-text-primary">{title}</h2>
          <p className="mt-0.5 text-xs text-text-secondary">{hint}</p>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} className="h-4 w-4" />
          Show on home page
        </label>
      </header>
      <div className={enabled ? 'flex flex-col gap-4 p-5' : 'pointer-events-none flex flex-col gap-4 p-5 opacity-50'}>{children}</div>
    </section>
  )
}

function HeroImageField({ label, value, onChange }: { label: string; value: string; onChange: (path: string) => void }) {
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
      <div className="flex gap-2">
        <input ref={inputRef} type="file" accept={IMAGE_TYPES.join(',')} className="hidden" onChange={(e) => handleFile(e.target.files)} />
        <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
    </div>
  )
}

interface PickerProduct {
  id: string
  name: string
  brand: string | null
  status: string
}

/** Ordered multi-select of products. An empty selection means the section falls back to its automatic rule. */
function ProductPicker({ value, onChange, autoNote }: { value: string[]; onChange: (ids: string[]) => void; autoNote: string }) {
  const { data } = useAdminProductsList()
  const [query, setQuery] = useState('')
  const products = (data ?? []) as unknown as PickerProduct[]
  const byId = new Map(products.map((p) => [p.id, p]))
  const q = query.trim().toLowerCase()
  const results = products
    .filter((p) => !value.includes(p.id) && p.status === 'active')
    .filter((p) => !q || p.name.toLowerCase().includes(q) || (p.brand ?? '').toLowerCase().includes(q))
    .slice(0, 6)

  function move(index: number, dir: -1 | 1) {
    const next = [...value]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <span className="text-sm text-text-secondary">Products to show</span>
        <p className="text-xs text-text-muted">
          {value.length === 0 ? `None picked — ${autoNote}` : `${value.length} hand-picked, shown in this order.`}
        </p>
      </div>

      {value.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {value.map((id, i) => (
            <li key={id} className="flex items-center gap-2 rounded-btn border border-border bg-bg-main px-3 py-2 text-sm">
              <span className="w-5 text-xs text-text-muted">{i + 1}</span>
              <span className="flex-1 truncate text-text-primary">{byId.get(id)?.name ?? 'Unavailable product'}</span>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1 text-text-secondary hover:text-accent disabled:opacity-30" aria-label="Move up">
                <ArrowUp size={14} />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="p-1 text-text-secondary hover:text-accent disabled:opacity-30" aria-label="Move down">
                <ArrowDown size={14} />
              </button>
              <button type="button" onClick={() => onChange(value.filter((v) => v !== id))} className="p-1 text-text-secondary hover:text-danger" aria-label="Remove">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <Search size={15} className="absolute top-1/2 left-3 z-10 -translate-y-1/2 text-text-muted" />
        <Input placeholder="Search products to add..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
      </div>
      {q && (
        <ul className="flex flex-col gap-1">
          {results.length === 0 && <li className="px-1 text-xs text-text-muted">No matching active products.</li>}
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  onChange([...value, p.id])
                  setQuery('')
                }}
                className="flex w-full items-center justify-between rounded-btn border border-border px-3 py-2 text-left text-sm hover:border-accent hover:text-accent"
              >
                <span className="truncate">{p.name}</span>
                <span className="ml-3 shrink-0 text-xs text-text-muted">+ Add</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function HomePageEditor() {
  const { data: saved, isPlaceholderData } = useHomeContent()
  const { data: categories } = useAdminCategories()
  const save = useSaveHomeContent()
  const [form, setForm] = useState<HomeContent>(HOME_DEFAULTS)
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

  function toggleCategory(id: string) {
    const hidden = form.categories.hiddenIds
    patch('categories', { hiddenIds: hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id] })
  }

  const { hero, trending, deals } = form

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Home Page</h1>
          <p className="mt-0.5 text-sm text-text-secondary">Control what visitors see on the storefront home page.</p>
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

      <div className="flex flex-col gap-5">
        <Section title="Hero Banner" hint="The large banner with heading and buttons below the navbar." enabled={hero.enabled} onToggle={(v) => patch('hero', { enabled: v })}>
          <Input label="Badge text (leave empty to hide)" value={hero.badge} onChange={(e) => patch('hero', { badge: e.target.value })} />
          <Textarea label="Heading (press Enter for a new line)" rows={2} value={hero.title} onChange={(e) => patch('hero', { title: e.target.value })} />
          <Textarea label="Sub-heading" rows={2} value={hero.subtitle} onChange={(e) => patch('hero', { subtitle: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Primary button text" value={hero.primaryLabel} onChange={(e) => patch('hero', { primaryLabel: e.target.value })} />
            <Input label="Primary button link" value={hero.primaryLink} onChange={(e) => patch('hero', { primaryLink: e.target.value })} placeholder="/listing" />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" checked={hero.secondaryEnabled} onChange={(e) => patch('hero', { secondaryEnabled: e.target.checked })} className="h-4 w-4" />
            Show second button
          </label>
          {hero.secondaryEnabled && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Second button text" value={hero.secondaryLabel} onChange={(e) => patch('hero', { secondaryLabel: e.target.value })} />
              <Input label="Second button link" value={hero.secondaryLink} onChange={(e) => patch('hero', { secondaryLink: e.target.value })} placeholder="/listing?filter=deals" />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <HeroImageField label="Background — light theme" value={hero.imageLight} onChange={(p) => patch('hero', { imageLight: p })} />
            <HeroImageField label="Background — dark theme" value={hero.imageDark} onChange={(p) => patch('hero', { imageDark: p })} />
          </div>
          <button
            type="button"
            className="w-fit text-xs text-text-secondary underline hover:text-accent"
            onClick={() => patch('hero', { imageLight: HOME_DEFAULTS.hero.imageLight, imageDark: HOME_DEFAULTS.hero.imageDark })}
          >
            Reset backgrounds to default
          </button>
        </Section>

        <Section
          title="Categories"
          hint="The category tiles. Add, rename or reorder categories under Catalog → Categories."
          enabled={form.categories.enabled}
          onToggle={(v) => patch('categories', { enabled: v })}
        >
          <Input label="Section title" value={form.categories.title} onChange={(e) => patch('categories', { title: e.target.value })} />
          <Input label="Section subtitle" value={form.categories.subtitle} onChange={(e) => patch('categories', { subtitle: e.target.value })} />
          <div>
            <span className="text-sm text-text-secondary">Categories shown (click to hide / show)</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {(categories ?? [])
                .filter((c) => c.status === 'active')
                .map((c) => {
                  const shown = !form.categories.hiddenIds.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategory(c.id)}
                      className={
                        shown
                          ? 'rounded-full border border-accent bg-accent/10 px-3 py-1 text-sm font-medium text-accent'
                          : 'rounded-full border border-border px-3 py-1 text-sm text-text-muted line-through'
                      }
                    >
                      {c.name}
                    </button>
                  )
                })}
            </div>
          </div>
        </Section>

        <Section title="Trending Software" hint="Product row right after the categories." enabled={trending.enabled} onToggle={(v) => patch('trending', { enabled: v })}>
          <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
            <Input label="Section title" value={trending.title} onChange={(e) => patch('trending', { title: e.target.value })} />
            <Input label="Max products (1–12)" type="number" min={1} max={12} value={trending.limit} onChange={(e) => patch('trending', { limit: Number(e.target.value) })} />
          </div>
          <ProductPicker value={trending.productIds} onChange={(ids) => patch('trending', { productIds: ids })} autoNote="products marked Featured are shown automatically." />
        </Section>

        <Section title="Software Deals" hint="The discounted products band near the bottom of the page." enabled={deals.enabled} onToggle={(v) => patch('deals', { enabled: v })}>
          <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
            <Input label="Section title" value={deals.title} onChange={(e) => patch('deals', { title: e.target.value })} />
            <Input label="Max products (1–12)" type="number" min={1} max={12} value={deals.limit} onChange={(e) => patch('deals', { limit: Number(e.target.value) })} />
          </div>
          <Input label="Section subtitle" value={deals.subtitle} onChange={(e) => patch('deals', { subtitle: e.target.value })} />
          <Input label="Button text" value={deals.buttonLabel} onChange={(e) => patch('deals', { buttonLabel: e.target.value })} />
          <ProductPicker value={deals.productIds} onChange={(ids) => patch('deals', { productIds: ids })} autoNote="products with the biggest discounts are shown automatically." />
        </Section>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={save.isPending}>
          {save.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
