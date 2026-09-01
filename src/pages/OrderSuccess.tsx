import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, Loader2, Mail, Copy } from 'lucide-react'
import { lookupOrder, type OrderLookupResult } from '@/hooks/useOrderLookup'
import { formatINR } from '@/lib/formatters'
import { toast } from '@/store/toastStore'
import { Button } from '@/components/ui/Button'
import { ReceiptPrintHeader, DownloadReceiptButton } from '@/components/storefront/OrderReceipt'

const POLL_INTERVAL_MS = 3000
const MAX_ATTEMPTS = 15

export default function OrderSuccess() {
  const { orderId: orderNumber } = useParams()
  const [params] = useSearchParams()
  const email = params.get('email') ?? ''
  const [result, setResult] = useState<OrderLookupResult | null>(null)
  const [confirming, setConfirming] = useState(true)
  const attempts = useRef(0)

  useEffect(() => {
    if (!orderNumber || !email) return
    let cancelled = false

    async function poll() {
      const res = await lookupOrder(orderNumber!, email)
      if (cancelled) return
      setResult(res)
      attempts.current += 1

      const stillPending = res.paymentStatus === 'pending' && res.paymentMethod === 'online'
      if (stillPending && attempts.current < MAX_ATTEMPTS) {
        setTimeout(poll, POLL_INTERVAL_MS)
      } else {
        setConfirming(false)
      }
    }
    poll()
    return () => {
      cancelled = true
    }
  }, [orderNumber, email])

  function copyOrderNumber() {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber)
      toast('Order number copied', 'success')
    }
  }

  if (!result) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <Loader2 className="mb-4 animate-spin text-accent" size={32} />
        <p className="text-text-secondary">Loading your order...</p>
      </div>
    )
  }

  if (!result.found) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-text-primary">Order not found</h1>
        <p className="mt-2 text-sm text-text-secondary">{result.message}</p>
        <Link to="/track-order" className="mt-6 inline-block">
          <Button>Track an Order</Button>
        </Link>
      </div>
    )
  }

  const stillConfirming = confirming && result.paymentStatus === 'pending' && result.paymentMethod === 'online'

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 print:py-0 md:px-6 print:text-black">
      <ReceiptPrintHeader orderNumber={result.orderNumber} createdAt={result.createdAt} email={email} />

      <div className="flex flex-col items-center text-center print:hidden">
        {stillConfirming ? (
          <Loader2 className="mb-4 animate-spin text-accent" size={44} />
        ) : (
          <CheckCircle2 className="mb-4 text-success" size={48} />
        )}
        <h1 className="text-2xl font-bold text-text-primary">
          {stillConfirming ? 'Confirming your payment...' : 'Order Placed Successfully!'}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          {stillConfirming
            ? 'This usually takes just a few seconds. Please don’t close this page.'
            : 'A confirmation has been recorded. Save your order number to track it anytime.'}
        </p>

        <button
          onClick={copyOrderNumber}
          className="mt-5 flex items-center gap-2 rounded-btn border border-border bg-bg-card px-4 py-2 text-sm text-text-primary hover:border-accent"
        >
          Order #{result.orderNumber} <Copy size={14} />
        </button>
      </div>

      <div className="mt-8 rounded-card border border-border bg-bg-card p-5">
        <div className="flex flex-col gap-2 text-sm">
          {result.items?.map((item, i) => (
            <div key={i} className="flex justify-between text-text-secondary">
              <span>
                {item.productName} × {item.qty}
              </span>
              <span>{formatINR(item.price * item.qty)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-2 text-text-secondary">
            <span>Delivery Charge</span>
            <span>{result.deliveryCharge ? formatINR(result.deliveryCharge) : 'Free'}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-text-primary">
            <span>Total Paid</span>
            <span>{formatINR(result.total ?? 0)}</span>
          </div>
        </div>
      </div>

      {!stillConfirming && result.deliveryType === 'email' && (
        <div className="mt-6 rounded-card border border-accent/30 bg-accent/5 p-5 print:hidden">
          <div className="mb-2 flex items-center gap-2 text-accent">
            <Mail size={18} />
            <h3 className="font-semibold">Check your email</h3>
          </div>
          <p className="text-sm text-text-secondary">
            {result.items?.some((i) => i.licenseKey)
              ? 'Your license key has been sent to your email along with activation instructions.'
              : 'Your license key is being generated and will be emailed to you shortly.'}
          </p>
        </div>
      )}

      {!stillConfirming && result.deliveryType === 'courier' && (
        <div className="mt-6 rounded-card border border-border bg-bg-card p-5 print:hidden">
          <h3 className="mb-2 font-semibold text-text-primary">Shipping Status</h3>
          <p className="text-sm text-text-secondary">
            {result.trackingNumber
              ? `Your order has shipped via ${result.courier}. Tracking number: ${result.trackingNumber}`
              : 'We are preparing your order for shipment. You will be notified once it ships.'}
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 print:hidden sm:flex-row sm:justify-center">
        {!stillConfirming && <DownloadReceiptButton />}
        <Link to="/track-order">
          <Button variant="outline">Track This Order</Button>
        </Link>
        <Link to="/listing">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    </div>
  )
}
