import { Badge } from '@/components/ui/Badge'

const ORDER_STATUS_TONE = {
  pending: 'warning',
  processing: 'accent',
  shipped: 'accent',
  delivered: 'success',
  cancelled: 'danger',
} as const

const PAYMENT_STATUS_TONE = {
  pending: 'warning',
  paid: 'success',
  failed: 'danger',
  refunded: 'neutral',
} as const

export function OrderStatusBadge({ status }: { status: keyof typeof ORDER_STATUS_TONE }) {
  return <Badge tone={ORDER_STATUS_TONE[status]}>{status}</Badge>
}

export function PaymentStatusBadge({ status }: { status: keyof typeof PAYMENT_STATUS_TONE }) {
  return <Badge tone={PAYMENT_STATUS_TONE[status]}>{status}</Badge>
}
