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
    delivery_charge_courier: '',
    delivery_charge_free_above: '',
    delivery_email_charge: '',
    cod_extra_charge: '',
    cod_enabled: true,
    low_stock_threshold: '',
  })

  useEffect(() => {
    if (settings) {
      setForm({
        delivery_charge_courier: String(settings.delivery_charge_courier),
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
      delivery_charge_courier: form.delivery_charge_courier,
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
      <h1 className="mb-6 text-xl font-bold text-text-primary">Shipping & Delivery Charges</h1>
      <div className="flex flex-col gap-4 rounded-card border border-border bg-bg-card p-5">
        <Input
          label="Courier Delivery Charge (₹)"
          type="number"
          value={form.delivery_charge_courier}
          onChange={(e) => setForm({ ...form, delivery_charge_courier: e.target.value })}
        />
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
