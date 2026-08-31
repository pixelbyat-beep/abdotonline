import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { toast } from '@/store/toastStore'
import { Select } from '@/components/ui/Select'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const COURIERS = ['India Post', 'DTDC', 'Delhivery', 'Shadowfax', 'Other']

export default function TrackingAdd() {
  const queryClient = useQueryClient()
  const { data: orders } = useQuery({
    queryKey: ['admin', 'shipping', 'untracked'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, guest_name')
        .eq('delivery_type', 'courier')
        .eq('payment_status', 'paid')
        .is('tracking_number', null)
      if (error) throw error
      return data
    },
  })

  const [orderId, setOrderId] = useState('')
  const [tracking, setTracking] = useState('')
  const [courier, setCourier] = useState(COURIERS[0])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!orderId || !tracking.trim()) {
      toast('Please select an order and enter a tracking number', 'error')
      return
    }
    setSaving(true)
    await supabase.from('orders').update({ tracking_number: tracking, courier, order_status: 'shipped' }).eq('id', orderId)
    await supabase.from('shipments').insert({ order_id: orderId, tracking_number: tracking, courier_name: courier, status: 'shipped', notes })
    setSaving(false)
    toast('Tracking number added', 'success')
    setOrderId('')
    setTracking('')
    setNotes('')
    queryClient.invalidateQueries({ queryKey: ['admin', 'shipping'] })
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-xl font-bold text-text-primary">Add Tracking Number</h1>
      <div className="flex flex-col gap-4 rounded-card border border-border bg-bg-card p-5">
        <Select label="Order" value={orderId} onChange={(e) => setOrderId(e.target.value)}>
          <option value="">Select an order awaiting shipment</option>
          {orders?.map((o) => (
            <option key={o.id} value={o.id}>#{o.order_number} — {o.guest_name}</option>
          ))}
        </Select>
        <Input label="Tracking Number" placeholder="EE123456789IN" value={tracking} onChange={(e) => setTracking(e.target.value)} />
        <Select label="Courier" value={courier} onChange={(e) => setCourier(e.target.value)}>
          {COURIERS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Textarea label="Notes (optional)" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Tracking'}
        </Button>
      </div>
    </div>
  )
}
