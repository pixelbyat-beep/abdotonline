import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Heart, Mail, Truck, ShieldCheck, ShoppingCart, Star, Lock, Headphones } from 'lucide-react'
import { useProductBySlug, useRelatedProducts } from '@/hooks/useProducts'
import { useProductReviews, useSubmitReview } from '@/hooks/useReviews'
import { useWishlist } from '@/hooks/useWishlist'
import { useAuth } from '@/context/AuthProvider'
import { useCartStore } from '@/store/cartStore'
import { toast } from '@/store/toastStore'
import { publicImageUrl } from '@/lib/supabaseClient'
import { formatDate } from '@/lib/formatters'
import { PriceTag } from '@/components/ui/PriceTag'
import { DiscountBadge } from '@/components/ui/DiscountBadge'
import { StarRating } from '@/components/ui/StarRating'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { ProductCard } from '@/components/storefront/ProductCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'

export default function ProductDetail() {
  const { slug } = useParams()
  const { data: product, isLoading } = useProductBySlug(slug)
  const { data: related } = useRelatedProducts(product?.category_id ?? undefined, product?.id)
  const { data: reviews } = useProductReviews(product?.id)
  const { productIds, toggle } = useWishlist()
  const { user } = useAuth()
  const addItem = useCartStore((s) => s.addItem)
  const [activeImage, setActiveImage] = useState(0)
  const [qty, setQty] = useState(1)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [guestName, setGuestName] = useState('')
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description')
  const submitReview = useSubmitReview(product?.id ?? '')

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <Skeleton className="aspect-square" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-text-secondary">Product not found.</div>
  }

  const images = product.product_images.length ? product.product_images : []
  const isWishlisted = productIds.includes(product.id)

  function handleAddToCart() {
    if (!product) return
    addItem({
      productId: product.id,
      qty,
      name: product.name,
      slug: product.slug,
      price: product.price,
      originalPrice: product.original_price,
      image: images[0] ? publicImageUrl(images[0].storage_path) : '',
      deliveryType: product.delivery_type,
      stockQty: product.stock_qty,
    })
    toast(`${product.name} added to cart`, 'success')
  }

  async function handleWishlist() {
    if (!product) return
    const res = await toggle(product.id)
    if (res.requiresAuth) {
      toast('Log in to save items to your wishlist', 'info')
      return
    }
    toast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist', 'success')
  }

  async function handleSubmitReview() {
    if (!reviewComment.trim()) {
      toast('Please write a short comment', 'error')
      return
    }
    if (!user && !guestName.trim()) {
      toast('Please enter your name', 'error')
      return
    }
    await submitReview.mutateAsync({
      rating: reviewRating,
      comment: reviewComment,
      guestName: user ? undefined : guestName,
      userId: user?.id,
    })
    setReviewComment('')
    setGuestName('')
    toast('Thanks! Your review will appear after approval.', 'success')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-square overflow-hidden rounded-card border border-border bg-bg-card">
            {images[activeImage] && (
              <img src={publicImageUrl(images[activeImage].storage_path)} alt={product.name} className="h-full w-full object-contain p-10" />
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    'h-16 w-16 shrink-0 overflow-hidden rounded-btn border-2 transition-colors',
                    i === activeImage ? 'border-accent' : 'border-border hover:border-accent/50',
                  )}
                >
                  <img src={publicImageUrl(img.storage_path)} alt="" className="h-full w-full object-contain p-1.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.categories && (
            <Link to={`/listing?category=${product.categories.slug}`} className="text-xs text-text-secondary hover:text-accent">
              {product.categories.name}
            </Link>
          )}
          <h1 className="mt-1 text-2xl font-bold text-text-primary md:text-3xl">{product.name}</h1>
          <p className="mt-1 text-sm font-medium text-accent">{product.brand}</p>

          <div className="mt-3 flex items-center gap-3">
            <StarRating rating={product.rating_avg} count={product.rating_count} />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <PriceTag price={product.price} originalPrice={product.original_price} size="lg" />
            <DiscountBadge pct={product.discount_pct} />
          </div>

          {product.license_info && <p className="mt-2 text-sm text-text-secondary">{product.license_info}</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            {(product.delivery_type === 'email' || product.delivery_type === 'both') && (
              <span className="inline-flex items-center gap-1.5 rounded-btn bg-text-primary/5 px-3 py-1.5 text-xs text-text-secondary">
                <Mail size={13} /> Email Delivery
              </span>
            )}
            {(product.delivery_type === 'courier' || product.delivery_type === 'both') && (
              <span className="inline-flex items-center gap-1.5 rounded-btn bg-text-primary/5 px-3 py-1.5 text-xs text-text-secondary">
                <Truck size={13} /> Courier Available
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-btn bg-text-primary/5 px-3 py-1.5 text-xs text-text-secondary">
              <ShieldCheck size={13} /> 100% Genuine
            </span>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-full border border-border">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2.5 text-text-primary hover:text-accent">
                −
              </button>
              <span className="w-10 text-center text-sm text-text-primary">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2.5 text-text-primary hover:text-accent">
                +
              </button>
            </div>
            <Button onClick={handleAddToCart} size="lg" pill glow className="flex-1">
              <ShoppingCart size={17} /> Add to Cart
            </Button>
            <button
              onClick={handleWishlist}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border hover:border-accent"
              aria-label="Toggle wishlist"
            >
              <Heart size={18} className={isWishlisted ? 'fill-accent text-accent' : 'text-text-primary'} />
            </button>
          </div>

          {/* Trust row */}
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-6 sm:grid-cols-4">
            {[
              { icon: ShieldCheck, label: 'Genuine' },
              { icon: Lock, label: 'Secure Pay' },
              { icon: Headphones, label: '24/7 Support' },
              { icon: Mail, label: 'Fast Delivery' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-text-secondary">
                <Icon size={15} className="shrink-0 text-accent" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs: Description / Reviews */}
      <div className="mt-14 border-t border-border pt-8">
        <div className="mb-6 flex gap-2 border-b border-border">
          {(['description', 'reviews'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                '-mb-px border-b-2 px-4 py-3 text-sm font-semibold capitalize transition-colors',
                activeTab === tab ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary',
              )}
            >
              {tab === 'reviews' ? `Reviews (${product.rating_count})` : 'Description'}
            </button>
          ))}
        </div>

        {activeTab === 'description' ? (
          <div className="max-w-3xl">
            {product.description ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">{product.description}</p>
            ) : (
              <p className="text-sm text-text-secondary">No description available for this product yet.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              {reviews && reviews.length > 0 ? (
                reviews.map((r) => (
                  <div key={r.id} className="rounded-card border border-border bg-bg-card p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">{r.guest_name || 'Verified Buyer'}</span>
                      <span className="text-xs text-text-muted">{formatDate(r.created_at)}</span>
                    </div>
                    <StarRating rating={r.rating} className="mt-1.5" />
                    {r.comment && <p className="mt-2 text-sm text-text-secondary">{r.comment}</p>}
                  </div>
                ))
              ) : (
                <p className="text-sm text-text-secondary">No reviews yet. Be the first to review this product.</p>
              )}
            </div>

            <div className="rounded-card border border-border bg-bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-text-primary">Write a review</h3>
              <div className="mb-3 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} onClick={() => setReviewRating(i + 1)} aria-label={`Rate ${i + 1} stars`}>
                    <Star size={22} className={i < reviewRating ? 'fill-accent text-accent' : 'fill-transparent text-border'} />
                  </button>
                ))}
              </div>
              {!user && (
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Your name"
                  className="mb-3 w-full rounded-btn border border-border bg-bg-main px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
                />
              )}
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with this product..."
                rows={3}
              />
              <Button onClick={handleSubmitReview} disabled={submitReview.isPending} className="mt-3">
                Submit Review
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Related products */}
      {related && related.length > 0 && (
        <div className="mt-14 border-t border-border pt-10">
          <h2 className="mb-6 text-xl font-bold text-text-primary">Related Products</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
