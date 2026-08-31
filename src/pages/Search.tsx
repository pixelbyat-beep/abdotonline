import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SearchIcon, SlidersHorizontal, X } from 'lucide-react'
import { useProductsList, useProductBrands } from '@/hooks/useProducts'
import { ProductCard } from '@/components/storefront/ProductCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'

const PAGE_SIZE = 12

export default function Search() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const sort = (params.get('sort') as 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'deals') || 'newest'
  const page = Number(params.get('page') ?? '1')
  const selectedBrands = useMemo(() => params.getAll('brand'), [params])
  const [input, setInput] = useState(q)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const { data: brands } = useProductBrands()
  const { data, isLoading } = useProductsList({ search: q || undefined, sort, page, pageSize: PAGE_SIZE, brands: selectedBrands })
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next = new URLSearchParams(params)
    if (input.trim()) next.set('q', input.trim())
    else next.delete('q')
    next.delete('page')
    setParams(next)
  }

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  function toggleBrand(brand: string) {
    const next = new URLSearchParams(params)
    next.delete('page')
    const current = next.getAll('brand')
    next.delete('brand')
    const nextSet = current.includes(brand) ? current.filter((b) => b !== brand) : [...current, brand]
    nextSet.forEach((b) => next.append('brand', b))
    setParams(next)
  }

  function clearBrands() {
    const next = new URLSearchParams(params)
    next.delete('brand')
    next.delete('page')
    setParams(next)
  }

  const brandFilterContent = (
    <div className="flex flex-col gap-1">
      {!brands?.length && <p className="text-sm text-text-secondary">No brands available.</p>}
      {brands?.map((b) => (
        <label key={b} className="flex cursor-pointer items-center gap-2.5 rounded-btn px-1 py-1.5 text-sm text-text-secondary hover:text-text-primary">
          <input
            type="checkbox"
            checked={selectedBrands.includes(b)}
            onChange={() => toggleBrand(b)}
            className="h-4 w-4 accent-accent"
          />
          {b}
        </label>
      ))}
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <form onSubmit={handleSubmit} className="mx-auto mb-6 flex max-w-xl gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search software, antivirus, Windows..."
          className="flex-1"
        />
        <Button type="submit" pill>
          <SearchIcon size={15} /> Search
        </Button>
      </form>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        {/* Sidebar - desktop */}
        {!!brands?.length && (
          <aside className="hidden lg:sticky lg:top-24 lg:block lg:h-fit">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Brand</h3>
              {selectedBrands.length > 0 && (
                <button onClick={clearBrands} className="text-xs text-accent hover:underline">
                  Clear
                </button>
              )}
            </div>
            {brandFilterContent}
          </aside>
        )}

        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-text-secondary">
              {q ? (data ? `${data.total} results for "${q}"` : '') : data ? `${data.total} products` : ''}
            </span>
            <div className="flex items-center gap-2">
              {!!brands?.length && (
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs text-text-primary hover:border-accent lg:hidden"
                >
                  <SlidersHorizontal size={13} />
                  Filters
                  {selectedBrands.length > 0 && <span className="text-accent">({selectedBrands.length})</span>}
                </button>
              )}
              <Select value={sort} onChange={(e) => updateParam('sort', e.target.value)} className="w-40 sm:w-44">
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="deals">Best Deals</option>
              </Select>
            </div>
          </div>

          {selectedBrands.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {selectedBrands.map((b) => (
                <button
                  key={b}
                  onClick={() => toggleBrand(b)}
                  className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs text-accent"
                >
                  {b}
                  <X size={12} />
                </button>
              ))}
              <button onClick={clearBrands} className="text-xs text-text-secondary hover:text-text-primary">
                Clear all
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-96" />)
              : data?.products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>

          {!isLoading && data?.products.length === 0 && (
            <div className="py-16 text-center text-text-secondary">
              {q ? (
                <p>No products found for "{q}".</p>
              ) : (
                <>
                  <p>Search for software, antivirus, Windows and more.</p>
                  <Link to="/listing" className="mt-4 inline-block text-accent hover:underline">
                    Or browse all products
                  </Link>
                </>
              )}
            </div>
          )}

          {!isLoading && (data?.products.length ?? 0) > 0 && (
            <div className="mt-8">
              <Pagination page={page} totalPages={totalPages} onChange={(p) => updateParam('page', String(p))} />
            </div>
          )}
        </div>
      </div>

      <Modal open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} title="Filters">
        <h3 className="mb-3 text-sm font-semibold text-text-primary">Brand</h3>
        {brandFilterContent}
      </Modal>
    </div>
  )
}
