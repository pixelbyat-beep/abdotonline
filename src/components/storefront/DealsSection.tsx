import { Link } from 'react-router-dom'
import { useDealsProducts } from '@/hooks/useProducts'
import { ProductCard } from './ProductCard'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

export function DealsSection() {
  const { data: products, isLoading } = useDealsProducts(4)

  if (!isLoading && (!products || products.length === 0)) return null

  return (
    <section className="border-t border-border bg-bg-header py-12">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8 text-center">
          <h2 className="text-xl font-bold text-text-primary md:text-2xl">Software Deals</h2>
          <p className="mt-2 text-sm text-text-secondary">Upgrade your digital experience without overspending.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-96" />)
            : products?.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        <div className="mt-8 flex justify-center">
          <Link to="/listing?filter=deals">
            <Button size="lg" pill glow>
              View All Deals
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
