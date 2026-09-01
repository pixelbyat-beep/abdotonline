import { useState } from 'react'
import { Package, Search } from 'lucide-react'
import { lookupOrder, type OrderLookupResult } from '@/hooks/useOrderLookup'
import { formatINR, formatDateTime } from '@/lib/formatters'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ReceiptPrintHeader, DownloadReceiptButton } from '@/components/storefront/OrderReceipt'

const STATUS_TONE: Record<string, 'accent' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  pending: 'warning',
  processing: 'accent',
  shipped: 'accent',
  delivered: 'success',
  cancelled: 'danger',
}

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<OrderLookupResult | null>(null)

  async function handleTrack() {
    if (!orderNumber.trim() || !email.trim()) return
    setLoading(true)
    const res = await lookupOrder(orderNumber.trim(), email.trim())
    setResult(res)
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 print:py-0 md:px-6 print:text-black">
      {result?.found && <ReceiptPrintHeader orderNumber={result.orderNumber} createdAt={result.createdAt} email={email} />}

      <div className="text-center print:hidden">
        <Package className="mx-auto mb-3 text-accent" size={36} />
        <h1 className="text-2xl font-bold text-text-primary">Track Your Order</h1>
        <p className="mt-2 text-sm text-text-secondary">No account needed — just enter your order number and email.</p>
      </div>

      <div className="mt-8 flex flex-col gap-3 rounded-card border border-border bg-bg-card p-5 print:hidden sm:flex-row sm:items-end">
        <Input label="Order Number" placeholder="ABD-XXXXXX" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} className="flex-1" />
        <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1" />
        <Button onClick={handleTrack} disabled={loading} className="sm:w-auto">
          <Search size={15} /> Track
        </Button>
      </div>

      {result && (
        <div className="mt-6 rounded-card border border-border bg-bg-card p-5">
          {!result.found ? (
            <p className="text-center text-sm text-text-secondary">{result.message || 'No order found with these details.'}</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between print:hidden">
                <div>
                  <p className="text-sm text-text-secondary">Order #{result.orderNumber}</p>
                  {result.createdAt && <p className="text-xs text-text-muted">{formatDateTime(result.createdAt)}</p>}
                </div>
                <Badge tone={STATUS_TONE[result.orderStatus ?? 'pending']}>{result.orderStatus}</Badge>
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
                {result.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-text-secondary">
                    <span>{item.productName} × {item.qty}</span>
                    <span>{formatINR(item.price * item.qty)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-2 font-semibold text-text-primary">
                  <span>Total</span>
                  <span>{formatINR(result.total ?? 0)}</span>
                </div>
              </div>

              {result.deliveryType === 'courier' && (
                <div className="rounded-btn bg-text-primary/5 p-3.5 text-sm">
                  {result.trackingNumber ? (
                    <>
                      <p className="text-text-primary">
                        Tracking Number: <span className="font-mono">{result.trackingNumber}</span> via {result.courier}
                      </p>
                      <a
                        href="https://www.indiapost.gov.in/vas/pages/trackconsignment.aspx"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-accent hover:underline"
                      >
                        Track at indiapost.gov.in →
                      </a>
                    </>
                  ) : (
                    <p className="text-text-secondary">Tracking number will appear here once your order ships.</p>
                  )}
                </div>
              )}

              <div className="print:hidden">
                <DownloadReceiptButton />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
