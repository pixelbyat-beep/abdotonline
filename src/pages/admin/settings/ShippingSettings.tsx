import { useEffect, useState } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { useUpdateSettings } from '@/hooks/useAdminSettings'
import { toast } from '@/store/toastStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function ShippingSettings() {
  const { data: settings } = useSettings()
  const updateSettings = useUpdateSettings()
  const [form, setForm] = useState({
    store_pincode: '',
    store_state: '',
    shipping_zone_local: '',
    shipping_zone_regional: '',
    shipping_zone_metro: '',
    shipping_zone_national: '',
    shipping_zone_special: '',
    delivery_charge_free_above: '',
    delivery_email_charge: '',
    cod_extra_charge: '',
    cod_enabled: true,
    low_stock_threshold: '',
  })

  useEffect(() => {
    if (settings) {
      setForm({
        store_pincode: settings.store_pincode,
        store_state: settings.store_state,
        shipping_zone_local: String(settings.shipping_zone_local),
        shipping_zone_regional: String(settings.shipping_zone_regional),
        shipping_zone_metro: String(settings.shipping_zone_metro),
        shipping_zone_national: String(settings.shipping_zone_national),
        shipping_zone_special: String(settings.shipping_zone_special),
        delivery_charge_free_above: String(settings.delivery_charge_free_above),
        delivery_email_charge: String(settings.delivery_email_charge),
        cod_extra_charge: String(settings.cod_extra_charge),
        cod_enabled: settings.cod_enabled,
        low_stock_threshold: String(settings.low_stock_threshold),
      })
    }
  }, [settings])

  async function handleSave() {
    await updateSettings.mutateAsync({
      store_pincode: form.store_pincode,
      store_state: form.store_state,
      shipping_zone_local: form.shipping_zone_local,
      shipping_zone_regional: form.shipping_zone_regional,
      shipping_zone_metro: form.shipping_zone_metro,
      shipping_zone_national: form.shipping_zone_national,
      shipping_zone_special: form.shipping_zone_special,
      delivery_charge_free_above: form.delivery_charge_free_above,
      delivery_email_charge: form.delivery_email_charge,
      cod_extra_charge: form.cod_extra_charge,
      cod_enabled: form.cod_enabled ? '1' : '0',
      low_stock_threshold: form.low_stock_threshold,
    })
    toast('Shipping settings updated', 'success')
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-xl font-bold text-text-primary">Shipping & Delivery Charges</h1>
      <p className="mb-6 text-sm text-text-secondary">
        Courier charges are calculated by zone (like Blue Dart's tiered pricing) based on how far a customer's pincode is from your
        dispatch location — same city, same state, metro-to-metro, rest of India, or a special/remote area.
      </p>

      <div className="flex flex-col gap-4 rounded-card border border-border bg-bg-card p-5">
        <h2 className="text-sm font-semibold text-text-primary">Dispatch Origin</h2>
        <p className="-mt-2 text-xs text-text-secondary">Used to work out which zone a customer's address falls into.</p>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Origin Pincode" value={form.store_pincode} onChange={(e) => setForm({ ...form, store_pincode: e.target.value })} maxLength={6} />
          <Input label="Origin State" value={form.store_state} onChange={(e) => setForm({ ...form, store_state: e.target.value })} />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 rounded-card border border-border bg-bg-card p-5">
        <h2 className="text-sm font-semibold text-text-primary">Courier Zone Rates (₹)</h2>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Local (same city)"
            type="number"
            value={form.shipping_zone_local}
            onChange={(e) => setForm({ ...form, shipping_zone_local: e.target.value })}
          />
          <Input
            label="Regional (same state)"
            type="number"
            value={form.shipping_zone_regional}
            onChange={(e) => setForm({ ...form, shipping_zone_regional: e.target.value })}
          />
          <Input
            label="Metro-to-metro"
            type="number"
            value={form.shipping_zone_metro}
            onChange={(e) => setForm({ ...form, shipping_zone_metro: e.target.value })}
          />
          <Input
            label="Rest of India"
            type="number"
            value={form.shipping_zone_national}
            onChange={(e) => setForm({ ...form, shipping_zone_national: e.target.value })}
          />
          <Input
            label="Special / remote area"
            type="number"
            className="col-span-2"
            value={form.shipping_zone_special}
            onChange={(e) => setForm({ ...form, shipping_zone_special: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 rounded-card border border-border bg-bg-card p-5">
        <Input
          label="Free Shipping Above (₹)"
          type="number"
          value={form.delivery_charge_free_above}
          onChange={(e) => setForm({ ...form, delivery_charge_free_above: e.target.value })}
        />
        <Input
          label="Email Delivery Charge (₹)"
          type="number"
          value={form.delivery_email_charge}
          onChange={(e) => setForm({ ...form, delivery_email_charge: e.target.value })}
        />
        <Input
          label="COD Extra Charge (₹)"
          type="number"
          value={form.cod_extra_charge}
          onChange={(e) => setForm({ ...form, cod_extra_charge: e.target.value })}
        />
        <Input
          label="Low Stock Alert Threshold"
          type="number"
          value={form.low_stock_threshold}
          onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input type="checkbox" checked={form.cod_enabled} onChange={(e) => setForm({ ...form, cod_enabled: e.target.checked })} className="accent-accent" />
          Enable Cash on Delivery
        </label>
        <Button onClick={handleSave} disabled={updateSettings.isPending} className="w-fit">
          {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
