import { Link } from 'react-router-dom'
import { Heart, Mail, Truck, ShoppingCart } from 'lucide-react'
import type { ProductWithImages } from '@/types/domain'
import { StarRating } from '@/components/ui/StarRating'
import { PriceTag } from '@/components/ui/PriceTag'
import { DiscountBadge } from '@/components/ui/DiscountBadge'
import { publicImageUrl } from '@/lib/supabaseClient'
import { useWishlist } from '@/hooks/useWishlist'
import { useCartStore } from '@/store/cartStore'
import { toast } from '@/store/toastStore'
import { cn } from '@/lib/cn'

export function ProductCard({ product }: { product: ProductWithImages }) {
  const { productIds, toggle } = useWishlist()
  const addItem = useCartStore((s) => s.addItem)
  const isWishlisted = productIds.includes(product.id)
  const image = product.product_images.find((i) => i.is_primary) ?? product.product_images[0]

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    if (product.stock_qty <= 0 && product.delivery_type !== 'email') {
      toast('This product is out of stock', 'error')
      return
    }
    addItem({
      productId: product.id,
      qty: 1,
      name: product.name,
      slug: product.slug,
      price: product.price,
      originalPrice: product.original_price,
      image: image ? publicImageUrl(image.storage_path) : '',
      deliveryType: product.delivery_type,
      stockQty: product.stock_qty,
    })
    toast(`${product.name} added to cart`, 'success')
  }

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault()
    const res = await toggle(product.id)
    if (res.requiresAuth) {
      toast('Log in to save items to your wishlist', 'info')
      return
    }
    toast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist', 'success')
  }

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-card border border-border bg-bg-card transition-all hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-white">
        {image ? (
          <img
            src={publicImageUrl(image.storage_path)}
            alt={product.name}
            className="h-full w-full object-contain p-6 transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-text-muted">No image</div>
        )}
        <button
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm transition-colors hover:bg-black/80"
        >
          <Heart size={16} className={cn(isWishlisted ? 'fill-accent text-accent' : 'text-white')} />
        </button>
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {product.featured && (
            <span className="w-fit rounded bg-accent/10 px-2 py-1 text-[10px] font-semibold tracking-wide text-accent backdrop-blur-sm">
              BEST SELLER
            </span>
          )}
          {product.discount_pct > 0 && <DiscountBadge pct={product.discount_pct} />}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <span className="text-xs font-medium uppercase tracking-wide text-accent">{product.brand}</span>
        <h3 className="line-clamp-2 text-sm font-semibold text-text-primary">{product.name}</h3>
        {product.license_info && <p className="text-xs text-text-secondary">{product.license_info}</p>}
        <StarRating rating={product.rating_avg} count={product.rating_count} />
        <PriceTag price={product.price} originalPrice={product.original_price} />

        <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded bg-bg-elevated px-2 py-0.5 text-[11px] text-text-secondary">
          {product.delivery_type === 'email' ? (
            <>
              <Mail size={11} /> Email Delivery
            </>
          ) : product.delivery_type === 'courier' ? (
            <>
              <Truck size={11} /> Courier Available
            </>
          ) : (
            <>
              <Mail size={11} /> Email + Courier
            </>
          )}
        </span>

        <button
          onClick={handleAddToCart}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-btn bg-accent py-2.5 text-sm font-semibold text-black transition-colors hover:bg-accent-dark"
        >
          <ShoppingCart size={15} />
          Add to Cart
        </button>
      </div>
    </Link>
  )
}
