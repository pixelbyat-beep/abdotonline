import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Truck, User, CreditCard, CheckCircle2 } from 'lucide-react'
import { useCartStore, cartSubtotal } from '@/store/cartStore'
import { useSettings } from '@/hooks/useSettings'
import { useAuth } from '@/context/AuthProvider'
import { supabase, edgeFunctionUrl } from '@/lib/supabaseClient'
import { openRazorpayCheckout } from '@/lib/razorpay'
import { formatINR } from '@/lib/formatters'
import { toast } from '@/store/toastStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

export default function Checkout() {
  const { items, coupon, clear } = useCartStore()
  const { data: settings } = useSettings()
  const { user } = useAuth()
  const navigate = useNavigate()

  const canEmail = items.every((i) => i.deliveryType !== 'courier')
  const canCourier = items.every((i) => i.deliveryType !== 'email')
  const [deliveryType, setDeliveryType] = useState<'email' | 'courier'>(canEmail ? 'email' : 'courier')
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: user?.user_metadata?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
  })

  const subtotal = cartSubtotal(items)
  const discount = coupon ? (coupon.type === 'percent' ? Math.round((subtotal * coupon.value) / 100) : Math.min(coupon.value, subtotal)) : 0
  const afterDiscount = subtotal - discount

  const deliveryCharge = useMemo(() => {
    if (!settings) return 0
    if (deliveryType === 'email') return settings.delivery_email_charge
    if (afterDiscount >= settings.delivery_charge_free_above) return 0
    return settings.delivery_charge_courier
  }, [settings, deliveryType, afterDiscount])

  const codCharge = paymentMethod === 'cod' && settings ? settings.cod_extra_charge : 0
  const total = afterDiscount + deliveryCharge + codCharge

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function validate(): string | null {
    if (!form.name.trim()) return 'Please enter your name'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Please enter a valid email'
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) return 'Please enter a valid 10-digit phone number'
    if (deliveryType === 'courier') {
      if (!form.addressLine.trim()) return 'Please enter your address'
      if (!form.city.trim() || !form.state.trim()) return 'Please enter city and state'
      if (!/^\d{6}$/.test(form.pincode)) return 'Please enter a valid 6-digit pincode'
    }
    return null
  }

  async function handlePlaceOrder() {
    const error = validate()
    if (error) {
      toast(error, 'error')
      return
    }
    setSubmitting(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const res = await fetch(edgeFunctionUrl('create-order'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${sessionData.session?.access_token ?? anonKey}`,
        },
        body: JSON.stringify({
          guest: { name: form.name, email: form.email, phone: form.phone },
          userId: user?.id ?? null,
          deliveryType,
          paymentMethod,
          address:
            deliveryType === 'courier'
              ? { addressLine: form.addressLine, city: form.city, state: form.state, pincode: form.pincode }
              : null,
          items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
          couponCode: coupon?.code ?? null,
        }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Could not create order')

      if (paymentMethod === 'cod') {
        clear()
        navigate(`/order-success/${result.orderNumber}?email=${encodeURIComponent(form.email)}`)
        return
      }

      await openRazorpayCheckout({
        key: result.keyId,
        amount: result.amount,
        currency: 'INR',
        name: 'AbDotStore',
        description: `Order ${result.orderNumber}`,
        order_id: result.razorpayOrderId,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#19D9F2' },
        handler: async (response) => {
          try {
            await fetch(edgeFunctionUrl('razorpay-webhook'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                apikey: anonKey,
                Authorization: `Bearer ${sessionData.session?.access_token ?? anonKey}`,
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            })
          } finally {
            clear()
            navigate(`/order-success/${result.orderNumber}?email=${encodeURIComponent(form.email)}`)
          }
        },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
      })
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Something went wrong', 'error')
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-text-primary">Your cart is empty</h1>
        <Link to="/listing" className="mt-4 inline-block">
          <Button>Browse Products</Button>
        </Link>
      </div>
    )
  }

  const steps = [
    { label: 'Customer', icon: User, done: form.name.trim().length > 0 && /^\S+@\S+\.\S+$/.test(form.email) },
    { label: 'Delivery', icon: deliveryType === 'email' ? Mail : Truck, done: true },
    { label: 'Payment', icon: CreditCard, done: paymentMethod !== null },
    { label: 'Confirm', icon: CheckCircle2, done: false },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">Checkout</h1>

      {/* Step indicator */}
      <div className="mb-8 flex items-center">
        {steps.map((step, i) => (
          <div key={step.label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors sm:h-10 sm:w-10',
                  step.done ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-muted',
                )}
              >
                <step.icon size={16} />
              </div>
              <span className={cn('hidden text-[11px] font-medium sm:block', step.done ? 'text-text-primary' : 'text-text-muted')}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('mx-2 h-0.5 flex-1 transition-colors', steps[i + 1].done || step.done ? 'bg-accent/50' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          {/* Contact info — no login required */}
          <section className="rounded-card border border-border bg-bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-text-primary">
              Contact Details {!user && <span className="font-normal text-text-secondary">(no account needed — you'll track your order by email)</span>}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Full Name" value={form.name} onChange={(e) => update('name', e.target.value)} />
              <Input label="Phone Number" value={form.phone} onChange={(e) => update('phone', e.target.value)} maxLength={10} />
              <Input
                label="Email Address"
                type="email"
                className="sm:col-span-2"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>
          </section>

          {/* Delivery type */}
          <section className="rounded-card border border-border bg-bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-text-primary">Delivery Method</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                disabled={!canEmail}
                onClick={() => setDeliveryType('email')}
                className={cn(
                  'flex items-center gap-3 rounded-card border p-4 text-left transition-all disabled:opacity-40',
                  deliveryType === 'email' ? 'border-accent bg-accent/5 ring-2 ring-accent/30' : 'border-border hover:border-accent/40',
                )}
              >
                <Mail className="text-accent" size={20} />
                <div>
                  <p className="text-sm font-medium text-text-primary">Email Delivery</p>
                  <p className="text-xs text-text-secondary">Instant license key to your inbox</p>
                </div>
              </button>
              <button
                disabled={!canCourier}
                onClick={() => setDeliveryType('courier')}
                className={cn(
                  'flex items-center gap-3 rounded-card border p-4 text-left transition-all disabled:opacity-40',
                  deliveryType === 'courier' ? 'border-accent bg-accent/5 ring-2 ring-accent/30' : 'border-border hover:border-accent/40',
                )}
              >
                <Truck className="text-accent" size={20} />
                <div>
                  <p className="text-sm font-medium text-text-primary">Courier Shipping</p>
                  <p className="text-xs text-text-secondary">Physical box delivered to your address</p>
                </div>
              </button>
            </div>
          </section>

          {/* Address — only for courier */}
          {deliveryType === 'courier' && (
            <section className="rounded-card border border-border bg-bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold text-text-primary">Shipping Address</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="Address"
                  className="sm:col-span-2"
                  value={form.addressLine}
                  onChange={(e) => update('addressLine', e.target.value)}
                />
                <Input label="City" value={form.city} onChange={(e) => update('city', e.target.value)} />
                <Input label="State" value={form.state} onChange={(e) => update('state', e.target.value)} />
                <Input label="Pincode" value={form.pincode} onChange={(e) => update('pincode', e.target.value)} maxLength={6} />
              </div>
            </section>
          )}

          {/* Payment method */}
          <section className="rounded-card border border-border bg-bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-text-primary">Payment Method</h2>
            <div className="flex flex-col gap-2.5">
              <label
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-card border p-3.5 transition-all',
                  paymentMethod === 'online' ? 'border-accent bg-accent/5 ring-2 ring-accent/30' : 'border-border hover:border-accent/40',
                )}
              >
                <input type="radio" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="accent-accent" />
                <span className="text-sm text-text-primary">UPI / Card / Net Banking (Razorpay)</span>
              </label>
              {deliveryType === 'courier' && settings?.cod_enabled && (
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-card border p-3.5 transition-all',
                    paymentMethod === 'cod' ? 'border-accent bg-accent/5 ring-2 ring-accent/30' : 'border-border hover:border-accent/40',
                  )}
                >
                  <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-accent" />
                  <span className="text-sm text-text-primary">Cash on Delivery (+{formatINR(settings.cod_extra_charge)})</span>
                </label>
              )}
            </div>
          </section>
        </div>

        {/* Order summary */}
        <div className="h-fit rounded-card border border-border bg-bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Order Summary</h2>
          <div className="flex flex-col gap-2 text-sm">
            {items.map((i) => (
              <div key={i.productId} className="flex justify-between text-text-secondary">
                <span className="line-clamp-1">
                  {i.name} × {i.qty}
                </span>
                <span>{formatINR(i.price * i.qty)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-border pt-3 text-text-secondary">
              <span>Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            {coupon && (
              <div className="flex justify-between text-success">
                <span>Coupon ({coupon.code})</span>
                <span>-{formatINR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-text-secondary">
              <span>Delivery Charge</span>
              <span>{deliveryCharge === 0 ? 'Free' : formatINR(deliveryCharge)}</span>
            </div>
            {codCharge > 0 && (
              <div className="flex justify-between text-text-secondary">
                <span>COD Charge</span>
                <span>{formatINR(codCharge)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold text-text-primary">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>

          <Button fullWidth size="lg" pill glow className="mt-5" onClick={handlePlaceOrder} disabled={submitting}>
            {submitting ? 'Processing...' : paymentMethod === 'cod' ? 'Place Order' : `Pay ${formatINR(total)}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
