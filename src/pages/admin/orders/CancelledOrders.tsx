import { OrdersList } from './OrdersList'

export default function CancelledOrders() {
  return <OrdersList filter="cancelled" title="Cancelled Orders" />
}
