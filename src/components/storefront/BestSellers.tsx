import { Link } from 'react-router-dom'
import { ArrowRight, TrendingUp } from 'lucide-react'
import { useFeaturedProducts, useProductsByIds } from '@/hooks/useProducts'
import { useHomeContent } from '@/hooks/useHomeContent'
import { ProductCard } from './ProductCard'
import { Skeleton } from '@/components/ui/Skeleton'

export function BestSellers() {
  const { data: home } = useHomeContent()
  const section = home!.trending
  const picked = section.productIds.length > 0
  const featured = useFeaturedProducts(section.limit)
  const manual = useProductsByIds(section.productIds)
  const { data: products, isLoading } = picked ? manual : featured

  if (!section.enabled) return null
  if (!isLoading && (!products || products.length === 0)) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold text-text-primary md:text-2xl">
          <TrendingUp size={24} className="text-accent" />
          {section.title}
        </h2>
        <Link to="/listing" className="flex items-center gap-1 text-sm font-medium text-accent hover:underline">
          View All <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {isLoading
          ? Array.from({ length: Math.min(section.limit, 4) }).map((_, i) => <Skeleton key={i} className="h-96" />)
          : products?.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  )
}
