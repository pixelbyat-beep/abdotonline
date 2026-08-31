import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, ChevronRight } from 'lucide-react'
import { useProductsList, useProductBrands } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { ProductCard } from '@/components/storefront/ProductCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { Select } from '@/components/ui/Select'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { CategoryIcon } from '@/lib/categoryIcons'
import { cn } from '@/lib/cn'

const PAGE_SIZE = 12

export default function Listing() {
  const [params, setParams] = useSearchParams()
  const category = params.get('category') ?? undefined
  const filter = params.get('filter')
  const sort = (params.get('sort') as 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'deals') || (filter === 'deals' ? 'deals' : 'newest')
  const page = Number(params.get('page') ?? '1')
  const selectedBrands = useMemo(() => params.getAll('brand'), [params])
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const { data: categories } = useCategories()
  const { data: brands } = useProductBrands(category)
  const { data, isLoading } = useProductsList({ categorySlug: category, sort, page, pageSize: PAGE_SIZE, brands: selectedBrands })

  const activeCategory = useMemo(() => categories?.find((c) => c.slug === category), [categories, category])
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

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
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-1.5 text-xs text-text-secondary">
        <Link to="/" className="hover:text-accent">
          Home
        </Link>
        <ChevronRight size={12} />
        <Link to="/listing" className="hover:text-accent">
          Categories
        </Link>
        {activeCategory && (
          <>
            <ChevronRight size={12} />
            <span className="text-text-primary">{activeCategory.name}</span>
          </>
        )}
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{activeCategory ? activeCategory.name : 'All Products'}</h1>
        {activeCategory?.description && <p className="mt-1 text-sm text-text-secondary">{activeCategory.description}</p>}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        {/* Sidebar - desktop */}
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:h-fit">
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Categories</h3>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => updateParam('category', null)}
              className={cn(
                'flex items-center gap-2 rounded-btn px-3 py-2 text-left text-sm',
                !category ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
              )}
            >
              All Products
            </button>
            {categories?.map((c) => (
              <button
                key={c.id}
                onClick={() => updateParam('category', c.slug)}
                className={cn(
                  'flex items-center gap-2 rounded-btn px-3 py-2 text-left text-sm',
                  category === c.slug ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
                )}
              >
                <CategoryIcon icon={c.icon} size={15} />
                {c.name}
              </button>
            ))}
          </div>

          {!!brands?.length && (
            <>
              <h3 className="mb-3 mt-6 text-sm font-semibold text-text-primary">Brand</h3>
              {brandFilterContent}
            </>
          )}
        </aside>

        <div>
          {/* Mobile category pills */}
          <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-thin pb-1 lg:hidden">
            <button
              onClick={() => updateParam('category', null)}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-xs',
                !category ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary',
              )}
            >
              All
            </button>
            {categories?.map((c) => (
              <button
                key={c.id}
                onClick={() => updateParam('category', c.slug)}
                className={cn(
                  'shrink-0 rounded-full border px-3.5 py-1.5 text-xs',
                  category === c.slug ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary',
                )}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="mb-5 flex items-center justify-between gap-3">
            <span className="text-sm text-text-secondary">{data ? `${data.total} products` : ''}</span>
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

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-96" />)
              : data?.products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>

          {!isLoading && data?.products.length === 0 && (
            <div className="py-16 text-center text-text-secondary">No products found.</div>
          )}

          <div className="mt-8">
            <Pagination page={page} totalPages={totalPages} onChange={(p) => updateParam('page', String(p))} />
          </div>
        </div>
      </div>

      <Modal open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} title="Filters">
        <h3 className="mb-3 text-sm font-semibold text-text-primary">Brand</h3>
        {brandFilterContent}
      </Modal>
    </div>
  )
}
