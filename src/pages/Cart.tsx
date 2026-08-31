import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, ShoppingBag, Tag, ShieldCheck, Zap, Headphones } from 'lucide-react'
import { useCartStore, cartSubtotal } from '@/store/cartStore'
import { validateCoupon } from '@/lib/coupon'
import { toast } from '@/store/toastStore'
import { formatINR } from '@/lib/formatters'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function Cart() {
  const { items, setQty, removeItem, coupon, setCoupon } = useCartStore()
  const navigate = useNavigate()
  const [couponInput, setCouponInput] = useState(coupon?.code ?? '')
  const [validating, setValidating] = useState(false)

  const subtotal = cartSubtotal(items)
  const discount = coupon
    ? coupon.type === 'percent'
      ? Math.round((subtotal * coupon.value) / 100)
      : Math.min(coupon.value, subtotal)
    : 0

  async function applyCoupon() {
    if (!couponInput.trim()) return
    setValidating(true)
    const result = await validateCoupon(couponInput.trim().toUpperCase(), subtotal)
    setValidating(false)
    if (!result.valid) {
      toast(result.message || 'Invalid coupon code', 'error')
      setCoupon(null)
      return
    }
    setCoupon({ code: result.code!, type: result.type!, value: result.value! })
    toast(`Coupon ${result.code} applied!`, 'success')
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24 text-center">
        <ShoppingBag size={48} className="mb-4 text-text-muted" />
        <h1 className="text-xl font-semibold text-text-primary">Your cart is empty</h1>
        <p className="mt-1 text-sm text-text-secondary">Add some genuine software to get started.</p>
        <Link to="/listing" className="mt-6">
          <Button size="lg" pill glow>
            Browse Products
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">Your Cart ({items.length})</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="group flex flex-col gap-4 rounded-card border border-border border-l-4 border-l-transparent bg-bg-card p-4 transition-colors hover:border-l-accent sm:flex-row"
            >
              <Link
                to={`/product/${item.slug}`}
                className="h-20 w-20 shrink-0 self-center overflow-hidden rounded-btn bg-bg-elevated sm:self-start"
              >
                {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
              </Link>
              <div className="flex flex-1 flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/product/${item.slug}`} className="text-sm font-medium text-text-primary hover:text-accent">
                    {item.name}
                  </Link>
                  <button
                    onClick={() => removeItem(item.productId)}
                    aria-label="Remove item"
                    className="shrink-0 text-text-muted hover:text-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center rounded-full border border-border">
                    <button
                      onClick={() => setQty(item.productId, item.qty - 1)}
                      aria-label="Decrease quantity"
                      className="flex h-8 w-8 items-center justify-center text-text-primary hover:text-accent"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm text-text-primary">{item.qty}</span>
                    <button
                      onClick={() => setQty(item.productId, item.qty + 1)}
                      aria-label="Increase quantity"
                      className="flex h-8 w-8 items-center justify-center text-text-primary hover:text-accent"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-semibold text-text-primary">{formatINR(item.price * item.qty)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-card border border-border bg-bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Order Summary</h2>

          <div className="mb-4 flex gap-2">
            <Input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="Coupon code"
              className="flex-1"
            />
            <Button variant="outline" onClick={applyCoupon} disabled={validating}>
              <Tag size={14} /> Apply
            </Button>
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            {coupon && (
              <div className="flex justify-between text-success">
                <span>Coupon ({coupon.code})</span>
                <span>-{formatINR(discount)}</span>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between rounded-btn border-l-4 border-l-accent bg-bg-elevated px-4 py-3">
            <span className="text-sm font-medium text-text-primary">Total Due</span>
            <span className="text-lg font-bold text-accent">{formatINR(subtotal - discount)}</span>
          </div>
          <p className="mt-2 text-xs text-text-muted">Delivery charge is calculated at checkout based on delivery method.</p>

          <Button fullWidth size="lg" pill glow className="mt-5" onClick={() => navigate('/checkout')}>
            Proceed to Checkout
          </Button>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 border-t border-border pt-8 sm:grid-cols-4">
        {[
          { icon: ShieldCheck, label: '100% Genuine' },
          { icon: Zap, label: 'Instant Delivery' },
          { icon: Headphones, label: '24/7 Support' },
          { icon: Tag, label: 'Best Price Guarantee' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-2 text-center">
            <Icon size={20} className="text-accent" />
            <span className="text-xs text-text-secondary">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
