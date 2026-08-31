import { Navigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { useAuth } from '@/context/AuthProvider'
import { useWishlist } from '@/hooks/useWishlist'
import { supabase } from '@/lib/supabaseClient'
import { ProductCard } from '@/components/storefront/ProductCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import type { ProductWithImages } from '@/types/domain'

export default function Wishlist() {
  const { user, loading } = useAuth()
  const { productIds } = useWishlist()

  const { data: products, isLoading } = useQuery({
    queryKey: ['wishlist-products', productIds],
    enabled: productIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(*), categories(id, name, slug)')
        .in('id', productIds)
      if (error) throw error
      return data as unknown as ProductWithImages[]
    },
  })

  if (loading) return null
  if (!user) return <Navigate to="/auth" state={{ from: '/wishlist' }} replace />

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h1 className="text-2xl font-bold text-text-primary">My Wishlist{productIds.length > 0 && ` (${productIds.length})`}</h1>
        {productIds.length > 0 && (
          <span className="hidden text-xs text-text-secondary sm:block">Tap the heart on any item to remove it</span>
        )}
      </div>

      {productIds.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <Heart size={40} className="mb-3 text-text-muted" />
          <p className="text-text-secondary">Your wishlist is empty.</p>
          <Link to="/listing" className="mt-4">
            <Button pill glow>
              Browse Products
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-96" />)
            : products?.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
