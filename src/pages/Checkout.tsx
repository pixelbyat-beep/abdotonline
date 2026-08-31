import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Truck, MapPin, CreditCard } from 'lucide-react'
import { useCartStore, cartSubtotal } from '@/store/cartStore'
import { useSettings } from '@/hooks/useSettings'
import { useAuth } from '@/context/AuthProvider'
import { supabase, edgeFunctionUrl } from '@/lib/supabaseClient'
import { openRazorpayCheckout } from '@/lib/razorpay'
import { formatINR } from '@/lib/formatters'
import { toast } from '@/store/toastStore'
import { resolveShippingZone, shippingChargeForZone, ZONE_LABELS } from '@/lib/shipping'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

type Step = 1 | 2 | 3

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
  const [step, setStep] = useState<Step>(1)

  const [form, setForm] = useState({
    name: user?.user_metadata?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
  })

  const emailValid = /^\S+@\S+\.\S+$/.test(form.email)
  const addressValid =
    deliveryType === 'email'
      ? form.name.trim().length > 0 && /^\d{10}$/.test(form.phone.replace(/\D/g, ''))
      : form.name.trim().length > 0 &&
        /^\d{10}$/.test(form.phone.replace(/\D/g, '')) &&
        form.addressLine.trim().length > 0 &&
        form.city.trim().length > 0 &&
        form.state.trim().length > 0 &&
        /^\d{6}$/.test(form.pincode)

  const subtotal = cartSubtotal(items)
  const discount = coupon ? (coupon.type === 'percent' ? Math.round((subtotal * coupon.value) / 100) : Math.min(coupon.value, subtotal)) : 0
  const afterDiscount = subtotal - discount

  const zone = useMemo(() => {
    if (deliveryType !== 'courier' || !settings) return null
    if (!/^\d{6}$/.test(form.pincode) || !form.state.trim()) return null
    return resolveShippingZone(form.pincode, settings.store_pincode, form.state, settings.store_state)
  }, [deliveryType, form.pincode, form.state, settings])

  const freeShipping = settings ? afterDiscount >= settings.delivery_charge_free_above : false

  const deliveryCharge = useMemo(() => {
    if (!settings) return 0
    if (deliveryType === 'email') return settings.delivery_email_charge
    if (freeShipping) return 0
    if (!zone) return 0
    return shippingChargeForZone(zone, settings)
  }, [settings, deliveryType, freeShipping, zone])

  const codCharge = paymentMethod === 'cod' && settings ? settings.cod_extra_charge : 0
  const total = afterDiscount + deliveryCharge + codCharge

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function goToAddress() {
    if (!emailValid) {
      toast('Please enter a valid email', 'error')
      return
    }
    setStep(2)
  }

  function goToPayment() {
    if (!form.name.trim()) {
      toast('Please enter your name', 'error')
      return
    }
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) {
      toast('Please enter a valid 10-digit phone number', 'error')
      return
    }
    if (deliveryType === 'courier') {
      if (!form.addressLine.trim()) return toast('Please enter your address', 'error')
      if (!form.city.trim() || !form.state.trim()) return toast('Please enter city and state', 'error')
      if (!/^\d{6}$/.test(form.pincode)) return toast('Please enter a valid 6-digit pincode', 'error')
    }
    setStep(3)
  }

  async function handlePlaceOrder() {
    if (!emailValid || !addressValid) {
      toast('Please complete the previous steps first', 'error')
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

  const steps: { n: Step; label: string; icon: typeof Mail; done: boolean }[] = [
    { n: 1, label: 'Email', icon: Mail, done: emailValid },
    { n: 2, label: 'Address', icon: MapPin, done: emailValid && addressValid },
    { n: 3, label: 'Payment', icon: CreditCard, done: false },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">Checkout</h1>

      {/* Step indicator */}
      <div className="mb-8 flex items-center">
        {steps.map((s, i) => (
          <div key={s.label} className="flex flex-1 items-center last:flex-none">
            <button
              onClick={() => s.n < step && setStep(s.n)}
              disabled={s.n >= step}
              className={cn('flex flex-col items-center gap-1.5', s.n < step && 'cursor-pointer')}
            >
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors sm:h-10 sm:w-10',
                  step === s.n
                    ? 'border-accent bg-accent/10 text-accent'
                    : s.done
                      ? 'border-accent/60 bg-accent/5 text-accent'
                      : 'border-border text-text-muted',
                )}
              >
                <s.icon size={16} />
              </div>
              <span className={cn('hidden text-[11px] font-medium sm:block', step === s.n || s.done ? 'text-text-primary' : 'text-text-muted')}>
                {s.label}
              </span>
            </button>
            {i < steps.length - 1 && <div className={cn('mx-2 h-0.5 flex-1 transition-colors', s.done ? 'bg-accent/50' : 'bg-border')} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          {/* Step 1: Email only — no account required */}
          {step === 1 && (
            <section className="rounded-card border border-border bg-bg-card p-5">
              <h2 className="mb-1 text-sm font-semibold text-text-primary">What's your email?</h2>
              <p className="mb-4 text-xs text-text-secondary">
                {user ? "We'll use your account email, or enter a different one." : "No account needed — you'll track your order by email."}
              </p>
              <Input
                label="Email Address"
                type="email"
                autoFocus
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && goToAddress()}
              />
              <Button fullWidth size="lg" pill glow className="mt-5" onClick={goToAddress}>
                Continue
              </Button>
            </section>
          )}

          {/* Step 2: Delivery method + address (shipping charge calculated live) */}
          {step === 2 && (
            <>
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

              <section className="rounded-card border border-border bg-bg-card p-5">
                <h2 className="mb-4 text-sm font-semibold text-text-primary">{deliveryType === 'courier' ? 'Shipping Address' : 'Your Details'}</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input label="Full Name" value={form.name} onChange={(e) => update('name', e.target.value)} />
                  <Input label="Phone Number" value={form.phone} onChange={(e) => update('phone', e.target.value)} maxLength={10} />
                  {deliveryType === 'courier' && (
                    <>
                      <Input
                        label="Address"
                        className="sm:col-span-2"
                        value={form.addressLine}
                        onChange={(e) => update('addressLine', e.target.value)}
                      />
                      <Input label="City" value={form.city} onChange={(e) => update('city', e.target.value)} />
                      <Input label="State" value={form.state} onChange={(e) => update('state', e.target.value)} />
                      <Input label="Pincode" value={form.pincode} onChange={(e) => update('pincode', e.target.value)} maxLength={6} />
                    </>
                  )}
                </div>

                {deliveryType === 'courier' && (
                  <div className="mt-4 rounded-btn border border-border bg-bg-elevated px-3.5 py-2.5 text-xs text-text-secondary">
                    {freeShipping
                      ? 'Your order qualifies for free shipping.'
                      : zone
                        ? `Shipping zone: ${ZONE_LABELS[zone]} — ${formatINR(shippingChargeForZone(zone, settings!))}`
                        : 'Enter your city, state and pincode to calculate the courier charge.'}
                  </div>
                )}

                <div className="mt-5 flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button fullWidth size="lg" pill glow onClick={goToPayment}>
                    Continue to Payment
                  </Button>
                </div>
              </section>
            </>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
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
              <Button variant="outline" className="mt-5" onClick={() => setStep(2)}>
                Back
              </Button>
            </section>
          )}
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
              <span>
                {deliveryType === 'courier' && !freeShipping && !zone && step < 3
                  ? 'TBD'
                  : deliveryCharge === 0
                    ? 'Free'
                    : formatINR(deliveryCharge)}
              </span>
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

          {step === 3 && (
            <Button fullWidth size="lg" pill glow className="mt-5" onClick={handlePlaceOrder} disabled={submitting}>
              {submitting ? 'Processing...' : paymentMethod === 'cod' ? 'Place Order' : `Pay ${formatINR(total)}`}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
