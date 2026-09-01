import { Printer } from 'lucide-react'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/constants'
import { formatDateTime } from '@/lib/formatters'
import { Button } from '@/components/ui/Button'

export function ReceiptPrintHeader({
  orderNumber,
  createdAt,
  email,
}: {
  orderNumber?: string
  createdAt?: string
  email?: string
}) {
  return (
    <div className="mb-6 hidden border-b border-black pb-4 print:block">
      <h2 className="text-lg font-bold text-black">{STORE_NAME}</h2>
      <p className="text-xs text-black">{STORE_TAGLINE}</p>
      <p className="mt-3 text-sm text-black">Order Receipt — #{orderNumber}</p>
      {createdAt && <p className="text-xs text-black">{formatDateTime(createdAt)}</p>}
      {email && <p className="text-xs text-black">{email}</p>}
    </div>
  )
}

export function DownloadReceiptButton() {
  return (
    <Button variant="outline" onClick={() => window.print()} className="print:hidden">
      <Printer size={15} /> Download Receipt
    </Button>
  )
}
