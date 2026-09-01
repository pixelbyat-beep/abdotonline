import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Printer, Send } from 'lucide-react'
import { useAdminOrder, useUpdateOrderStatus } from '@/hooks/useAdminOrders'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/OrderStatusBadge'
import { WhatsAppNotifyButton } from '@/components/admin/WhatsAppNotifyButton'
import { formatDateTime, formatINR, maskLicenseKey } from '@/lib/formatters'
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

  return (
    <div className="flex flex-col gap-6 print:text-black">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to="/admin/orders" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
          <ArrowLeft size={15} /> Back to Orders
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer size={15} /> Print Invoice
          </Button>
          <WhatsAppNotifyButton order={order} phone={order.guest_phone ?? ''} productName={productName} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Order #{order.order_number}</h1>
          <p className="text-sm text-text-secondary">{formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex gap-2">
          <PaymentStatusBadge status={order.payment_status} />
          <OrderStatusBadge status={order.order_status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <section className="rounded-card border border-border bg-bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold text-text-primary">Items</h2>
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-border pb-3 text-sm last:border-0 last:pb-0">
                  <div>
                    <p className="text-text-primary">{item.product_name_snapshot} × {item.qty}</p>
                    {item.license_keys && (
                      <p className="mt-1 font-mono text-xs text-accent">{maskLicenseKey(item.license_keys.key_value)}</p>
                    )}
                  </div>
                  <span className="text-text-primary">{formatINR(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4 text-sm text-text-secondary">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
              <div className="flex justify-between"><span>Delivery Charge</span><span>{formatINR(order.delivery_charge)}</span></div>
              {order.discount_amount > 0 && <div className="flex justify-between"><span>Discount ({order.coupon_code})</span><span>-{formatINR(order.discount_amount)}</span></div>}
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-text-primary"><span>Total</span><span>{formatINR(order.total)}</span></div>
            </div>
          </section>

          {order.delivery_type === 'email' && (
            <section className="rounded-card border border-border bg-bg-card p-5 print:hidden">
              <h2 className="mb-3 text-sm font-semibold text-text-primary">License Key Delivery</h2>
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
                    className="mb-3 w-full rounded-btn border border-border bg-bg-elevated p-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                  />
                  <Button variant="outline" onClick={handleSendLicenseEmail} disabled={sending}>
                    <Send size={14} /> {order.license_key_sent_at ? 'Resend License Key Email' : 'Send License Key Email'}
                  </Button>
                </>
              )}
            </section>
          )}

          {order.delivery_type === 'courier' && (
            <section className="rounded-card border border-border bg-bg-card p-5 print:hidden">
              <h2 className="mb-3 text-sm font-semibold text-text-primary">Shipping & Tracking</h2>
              {order.tracking_number ? (
                <p className="text-sm text-text-secondary">
                  Tracking: <span className="font-mono text-text-primary">{order.tracking_number}</span> via {order.courier}
                </p>
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
            </section>
          )}

          <section className="rounded-card border border-border bg-bg-card p-5 print:hidden">
            <h2 className="mb-3 text-sm font-semibold text-text-primary">Update Order Status</h2>
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={order.order_status}
                onChange={(e) => updateStatus.mutate({ order_status: e.target.value as typeof order.order_status })}
                className="w-48"
              >
                {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
              {order.payment_method === 'cod' && order.payment_status !== 'paid' && (
                <Button variant="outline" onClick={handleMarkCashCollected}>Mark Cash Collected</Button>
              )}
              {order.order_status !== 'cancelled' && (
                <Button variant="danger" onClick={handleCancelOrder}>Cancel Order</Button>
              )}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className="rounded-card border border-border bg-bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold text-text-primary">Customer</h2>
            <div className="flex flex-col gap-1 text-sm text-text-secondary">
              <span className="text-text-primary">{order.guest_name}</span>
              <span>{order.guest_email}</span>
              <span>{order.guest_phone}</span>
            </div>
          </section>

          {order.delivery_type === 'courier' && (
            <section className="rounded-card border border-border bg-bg-card p-5">
              <h2 className="mb-3 text-sm font-semibold text-text-primary">Shipping Address</h2>
              <p className="text-sm text-text-secondary">
                {order.address_line}, {order.city}, {order.state} - {order.pincode}
              </p>
            </section>
          )}

          <section className="rounded-card border border-border bg-bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold text-text-primary">Payment</h2>
            <div className="flex flex-col gap-1 text-sm text-text-secondary">
              <span>Method: {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online (Razorpay)'}</span>
              {(order.payments as unknown as { razorpay_payment_id: string | null }[])?.[0]?.razorpay_payment_id && (
                <span className="break-all">Payment ID: {(order.payments as unknown as { razorpay_payment_id: string }[])[0].razorpay_payment_id}</span>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
