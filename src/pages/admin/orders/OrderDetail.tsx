import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Printer, Send, Eye, EyeOff, KeyRound, Truck, Mail, Phone, MapPin, Copy, Check, CircleDot, Circle } from 'lucide-react'
import { useAdminOrder, useUpdateOrderStatus } from '@/hooks/useAdminOrders'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/OrderStatusBadge'
import { WhatsAppNotifyButton } from '@/components/admin/WhatsAppNotifyButton'
import { formatDateTime, formatINR, maskLicenseKey } from '@/lib/formatters'
import { cn } from '@/lib/cn'
import { edgeFunctionUrl, supabase } from '@/lib/supabaseClient'
import { toast } from '@/store/toastStore'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const COURIERS = ['India Post', 'DTDC', 'Delhivery', 'Shadowfax', 'Other']

export default function OrderDetail() {
  const { id } = useParams()
  const { data: order, isLoading, refetch } = useAdminOrder(id)
  const updateStatus = useUpdateOrderStatus(id!)
  const [tracking, setTracking] = useState('')
  const [courier, setCourier] = useState(COURIERS[0])
  const [sending, setSending] = useState(false)
  const [emailMessage, setEmailMessage] = useState('')
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState(false)

  if (isLoading || !order) return <p className="text-text-secondary">Loading...</p>

  const currentOrder = order
  const items = currentOrder.order_items
  const productName = items[0]?.product_name_snapshot ?? ''

  async function handleSaveTracking() {
    if (!tracking.trim() || !order) {
      toast('Please enter a tracking number', 'error')
      return
    }
    await updateStatus.mutateAsync({ tracking_number: tracking, courier, order_status: 'shipped' })
    await supabase.from('shipments').insert({ order_id: order.id, tracking_number: tracking, courier_name: courier, status: 'shipped' })
    toast('Tracking updated', 'success')
    refetch()
  }

  async function handleSendLicenseEmail() {
    setSending(true)
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    const { data: sessionData } = await supabase.auth.getSession()
    const res = await fetch(edgeFunctionUrl('send-license-email'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${sessionData.session?.access_token}` },
      body: JSON.stringify({ orderId: currentOrder.id, message: emailMessage.trim() || undefined }),
    })
    setSending(false)
    if (!res.ok) {
      toast('Could not send email', 'error')
      return
    }
    toast('License key email sent', 'success')
    refetch()
  }

  async function handleMarkCashCollected() {
    await updateStatus.mutateAsync({ payment_status: 'paid' })
    toast('Marked as cash collected', 'success')
  }

  async function handleCancelOrder() {
    if (!confirm('Cancel this order?')) return
    await updateStatus.mutateAsync({ order_status: 'cancelled' })
    toast('Order cancelled', 'success')
  }

  const initials = (order.guest_name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const isPaid = order.payment_status === 'paid'
  const isShipped = order.order_status === 'shipped' || order.order_status === 'delivered'
  const isDelivered = order.order_status === 'delivered'
  const timeline = [
    { label: 'Order Placed', note: formatDateTime(order.created_at), done: true },
    { label: isPaid ? 'Payment Received' : 'Awaiting Payment', note: isPaid ? 'Payment confirmed' : 'Not paid yet', done: isPaid },
    { label: 'Shipped via Courier', note: order.tracking_number ? `${order.courier ?? 'Courier'} · ${order.tracking_number}` : 'Add tracking above', done: isShipped },
    { label: 'Delivered to Recipient', note: isDelivered ? 'Completed' : 'Pending confirmation', done: isDelivered },
  ]
  const card = 'rounded-card bg-bg-card p-5 shadow-[0_1px_3px_rgba(11,28,48,0.06)]'

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 print:text-black">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to="/admin/orders" className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-accent">
          <ArrowLeft size={15} /> Orders
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer size={15} /> Print Invoice
          </Button>
          <WhatsAppNotifyButton order={order} phone={order.guest_phone ?? ''} productName={productName} />
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Orders &rsaquo; #{order.order_number}</p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">#{order.order_number}</h1>
            <span
              className="rounded-full px-2.5 py-1 text-xs font-semibold text-text-secondary"
              style={{ background: order.delivery_type === 'email' ? undefined : '#dae2fd' }}
            >
              {order.delivery_type === 'email' ? 'Digital Order' : 'Courier Order'}
            </span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">{formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex gap-2">
          <PaymentStatusBadge status={order.payment_status} />
          <OrderStatusBadge status={order.order_status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-5">
          <section className={card}>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10 text-base font-bold text-accent">{initials}</span>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-text-primary">{order.guest_name}</p>
                <p className="text-xs text-text-secondary">Customer</p>
              </div>
              {order.guest_phone && (
                <a href={`tel:${order.guest_phone}`} className="ml-auto flex items-center gap-1.5 rounded-lg bg-bg-elevated px-3 py-2 text-sm font-semibold text-accent print:hidden">
                  <Phone size={14} /> Call
                </a>
              )}
            </div>
            <div className="mt-4 flex flex-col gap-2 rounded-xl bg-bg-elevated p-3 text-sm text-text-secondary">
              <span className="flex items-center gap-2">
                <Mail size={15} className="shrink-0" /> {order.guest_email}
                {order.delivery_type === 'email' && <span className="ml-auto rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-bold text-success">DIGITAL RECIPIENT</span>}
              </span>
              {order.delivery_type === 'courier' && (
                <span className="flex items-start gap-2">
                  <MapPin size={15} className="mt-0.5 shrink-0" /> {order.address_line}, {order.city}, {order.state} - {order.pincode}
                </span>
              )}
            </div>
          </section>

          {items.map((item) => {
            const key = item.license_keys?.key_value
            const isDigital = order.delivery_type === 'email'
            return (
              <section key={item.id} className={card}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                      isDigital ? 'bg-accent/10 text-accent' : 'text-text-secondary',
                    )}
                    style={!isDigital ? { background: '#dae2fd' } : undefined}
                  >
                    {isDigital ? <Mail size={12} /> : <Truck size={12} />}
                    {isDigital ? 'Digital Product · Instant Email Delivery' : 'Physical Product · Courier Delivery'}
                  </span>
                  <span className={cn('text-xs font-semibold', isDigital ? (order.license_key_sent_at ? 'text-success' : 'text-warning') : isShipped ? 'text-accent' : 'text-warning')}>
                    {isDigital ? (order.license_key_sent_at ? 'Delivered & Sent' : 'Key Not Sent') : isDelivered ? 'Delivered' : isShipped ? 'In Transit' : 'Not Shipped'}
                  </span>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-bold leading-snug text-text-primary">{item.product_name_snapshot}</p>
                    <p className="text-sm text-text-secondary">Qty: {item.qty}</p>
                  </div>
                  <span className="shrink-0 text-xl font-bold text-text-primary">{formatINR(item.price * item.qty)}</span>
                </div>

                {key && (
                  <div className="mt-4 rounded-xl bg-bg-elevated p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Assigned License Key</p>
                    <div className="flex items-center gap-2 rounded-lg bg-bg-card px-3 py-2.5">
                      <KeyRound size={16} className="shrink-0 text-accent" />
                      <span className="min-w-0 flex-1 truncate font-mono text-sm text-text-primary">
                        {revealed[item.id] ? key : maskLicenseKey(key).replace(/\*/g, '•')}
                      </span>
                      <button
                        onClick={() => setRevealed((r) => ({ ...r, [item.id]: !r[item.id] }))}
                        className="flex items-center gap-1 rounded-lg bg-accent/10 px-2.5 py-1.5 text-xs font-semibold text-accent print:hidden"
                      >
                        {revealed[item.id] ? <EyeOff size={13} /> : <Eye size={13} />} {revealed[item.id] ? 'Hide' : 'Reveal'}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )
          })}

          {order.delivery_type === 'email' && (
            <section className={cn(card, 'print:hidden')}>
              <h2 className="mb-1 text-base font-bold text-text-primary">License Key Delivery</h2>
              <p className="mb-3 text-sm text-text-secondary">
                {order.payment_status !== 'paid'
                  ? 'Waiting for payment confirmation.'
                  : order.license_key_sent_at
                    ? `License key email sent on ${formatDateTime(order.license_key_sent_at)}.`
                    : "A key is reserved for this order. Nothing is sent automatically — write your message below and send it whenever you're ready."}
              </p>
              {order.payment_status === 'paid' && (
                <>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="e.g. Thanks for your order! Here's your license key:"
                    rows={4}
                    className="mb-3 w-full rounded-xl bg-bg-elevated p-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <Button onClick={handleSendLicenseEmail} disabled={sending}>
                    <Send size={14} /> {order.license_key_sent_at ? 'Resend License Key Email' : 'Send License Key Email'}
                  </Button>
                </>
              )}
            </section>
          )}

          {order.delivery_type === 'courier' && (
            <section className={cn(card, 'print:hidden')}>
              <h2 className="mb-3 text-base font-bold text-text-primary">Courier & Tracking</h2>
              {order.tracking_number ? (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-bg-elevated p-3">
                  <div>
                    <p className="text-xs text-text-secondary">Tracking / Waybill · {order.courier}</p>
                    <p className="font-mono text-lg font-bold text-text-primary">{order.tracking_number}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(order.tracking_number ?? '')
                      setCopied(true)
                      setTimeout(() => setCopied(false), 1500)
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-2 text-sm font-semibold text-accent"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <Input placeholder="Tracking number (e.g. EE123456789IN)" value={tracking} onChange={(e) => setTracking(e.target.value)} />
                  <Select value={courier} onChange={(e) => setCourier(e.target.value)}>
                    {COURIERS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                  <Button onClick={handleSaveTracking}>Save</Button>
                </div>
              )}

              <p className="mb-3 mt-5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Live Courier Progress</p>
              <ol className="flex flex-col">
                {timeline.map((t, i) => (
                  <li key={t.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      {t.done ? <CircleDot size={18} className="text-success" /> : <Circle size={18} className="text-border" />}
                      {i < timeline.length - 1 && <span className={cn('my-1 w-0.5 flex-1', t.done ? 'bg-success/40' : 'bg-border')} />}
                    </div>
                    <div className="pb-4">
                      <p className={cn('text-sm font-semibold', t.done ? 'text-text-primary' : 'text-text-muted')}>{t.label}</p>
                      <p className="text-xs text-text-secondary">{t.note}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <section className={card}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-text-primary">Financial Summary</h2>
              {(order.payments as unknown as { razorpay_payment_id: string | null }[])?.[0]?.razorpay_payment_id && (
                <span className="max-w-[140px] truncate rounded bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                  {(order.payments as unknown as { razorpay_payment_id: string }[])[0].razorpay_payment_id}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2 text-sm text-text-secondary">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
              <div className="flex justify-between"><span>Delivery Charge</span><span>{formatINR(order.delivery_charge)}</span></div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-success"><span>Coupon ({order.coupon_code})</span><span>-{formatINR(order.discount_amount)}</span></div>
              )}
            </div>
            <div className="mt-4 rounded-xl bg-bg-elevated p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Total {isPaid ? 'paid' : 'payable'} by customer</p>
              <p className="text-3xl font-bold tracking-tight text-accent">{formatINR(order.total)}</p>
              <p className="mt-1 text-xs text-text-secondary">{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online (Razorpay)'}</p>
            </div>
          </section>

          <section className={cn(card, 'print:hidden')}>
            <h2 className="mb-3 text-base font-bold text-text-primary">Update Order</h2>
            <Select
              value={order.order_status}
              onChange={(e) => updateStatus.mutate({ order_status: e.target.value as typeof order.order_status })}
            >
              {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
            <div className="mt-3 flex flex-col gap-2">
              {order.payment_method === 'cod' && order.payment_status !== 'paid' && (
                <Button variant="outline" onClick={handleMarkCashCollected}>Mark Cash Collected</Button>
              )}
              {order.order_status !== 'cancelled' && (
                <Button variant="danger" onClick={handleCancelOrder}>Cancel / Refund</Button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
