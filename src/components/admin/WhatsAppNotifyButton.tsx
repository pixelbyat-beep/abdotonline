import { useState } from 'react'
import { MessageCircle, ChevronDown } from 'lucide-react'
import { openWhatsAppNotify, type WhatsAppTemplateKey } from '@/lib/whatsapp'
import type { Order } from '@/types/domain'

const TEMPLATE_OPTIONS: { key: WhatsAppTemplateKey; label: string }[] = [
  { key: 'order_confirmed', label: 'Order Confirmed' },
  { key: 'license_key_sent', label: 'License Key Sent' },
  { key: 'tracking_update', label: 'Tracking Update' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
]

export function WhatsAppNotifyButton({ order, phone, productName }: { order: Order; phone: string; productName: string }) {
  const [open, setOpen] = useState(false)

  function send(template: WhatsAppTemplateKey) {
    openWhatsAppNotify(phone, template, {
      name: order.guest_name || 'Customer',
      orderId: order.order_number,
      product: productName,
      amount: `₹${order.total}`,
      email: order.guest_email ?? '',
      trackingNo: order.tracking_number ?? '',
      courier: order.courier ?? '',
    })
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-btn bg-success/15 px-3.5 py-2 text-sm font-medium text-success hover:bg-success/25"
      >
        <MessageCircle size={15} /> Send WhatsApp <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-56 rounded-card border border-border bg-bg-card p-1.5 shadow-xl">
          {TEMPLATE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => send(opt.key)}
              className="block w-full rounded-btn px-3 py-2 text-left text-sm text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
