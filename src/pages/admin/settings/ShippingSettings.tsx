import { useEffect, useMemo, useState } from 'react'
import { Truck, Map, Scale, Gift, Calculator, Save, MapPin, Mail } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { useUpdateSettings } from '@/hooks/useAdminSettings'
import { toast } from '@/store/toastStore'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { formatINR } from '@/lib/formatters'
import { extraWeightSlabs, shippingChargeForZone, ZONE_LABELS, type ShippingZone, type ShippingZoneRates } from '@/lib/shipping'

const ZONES: { zone: ShippingZone; hint: string }[] = [
  { zone: 'local', hint: 'Same city as your dispatch pincode' },
  { zone: 'regional', hint: 'Same state as your dispatch location' },
  { zone: 'metro', hint: 'Delhi, Mumbai, Kolkata, Chennai, Bengaluru, Hyderabad, Pune, Ahmedabad' },
  { zone: 'national', hint: 'Everywhere else in India' },
  { zone: 'special', hint: 'J&K, North-East and island pincodes' },
]

function Card({ icon: Icon, title, subtitle, children }: { icon: typeof Truck; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Icon size={18} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

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
    shipping_addl_local: '',
    shipping_addl_regional: '',
    shipping_addl_metro: '',
    shipping_addl_national: '',
    shipping_addl_special: '',
    shipping_base_weight_kg: '',
    shipping_weight_step_kg: '',
    delivery_charge_free_above: '',
    delivery_email_charge: '',
    cod_extra_charge: '',
    cod_enabled: true,
    low_stock_threshold: '',
  })
  const [calcZone, setCalcZone] = useState<ShippingZone>('national')
  const [calcWeight, setCalcWeight] = useState('1.2')

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
        shipping_addl_local: String(settings.shipping_addl_local),
        shipping_addl_regional: String(settings.shipping_addl_regional),
        shipping_addl_metro: String(settings.shipping_addl_metro),
        shipping_addl_national: String(settings.shipping_addl_national),
        shipping_addl_special: String(settings.shipping_addl_special),
        shipping_base_weight_kg: String(settings.shipping_base_weight_kg),
        shipping_weight_step_kg: String(settings.shipping_weight_step_kg),
        delivery_charge_free_above: String(settings.delivery_charge_free_above),
        delivery_email_charge: String(settings.delivery_email_charge),
        cod_extra_charge: String(settings.cod_extra_charge),
        cod_enabled: settings.cod_enabled,
        low_stock_threshold: String(settings.low_stock_threshold),
      })
    }
  }, [settings])

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  // Live rates built from the (possibly unsaved) form so the calculator previews edits before saving.
  const liveRates: ShippingZoneRates = useMemo(
    () => ({
      shipping_zone_local: Number(form.shipping_zone_local) || 0,
      shipping_zone_regional: Number(form.shipping_zone_regional) || 0,
      shipping_zone_metro: Number(form.shipping_zone_metro) || 0,
      shipping_zone_national: Number(form.shipping_zone_national) || 0,
      shipping_zone_special: Number(form.shipping_zone_special) || 0,
      shipping_base_weight_kg: Number(form.shipping_base_weight_kg) || 0,
      shipping_weight_step_kg: Number(form.shipping_weight_step_kg) || 0.5,
      shipping_addl_local: Number(form.shipping_addl_local) || 0,
      shipping_addl_regional: Number(form.shipping_addl_regional) || 0,
      shipping_addl_metro: Number(form.shipping_addl_metro) || 0,
      shipping_addl_national: Number(form.shipping_addl_national) || 0,
      shipping_addl_special: Number(form.shipping_addl_special) || 0,
    }),
    [form],
  )

  const calcWeightNum = Math.max(0, Number(calcWeight) || 0)
  const calcSlabs = extraWeightSlabs(calcWeightNum, liveRates)
  const calcTotal = shippingChargeForZone(calcZone, liveRates, calcWeightNum)
  const calcBase = shippingChargeForZone(calcZone, liveRates, 0)

  async function handleSave() {
    await updateSettings.mutateAsync({
      store_pincode: form.store_pincode,
      store_state: form.store_state,
      shipping_zone_local: form.shipping_zone_local,
      shipping_zone_regional: form.shipping_zone_regional,
      shipping_zone_metro: form.shipping_zone_metro,
      shipping_zone_national: form.shipping_zone_national,
      shipping_zone_special: form.shipping_zone_special,
      shipping_addl_local: form.shipping_addl_local,
      shipping_addl_regional: form.shipping_addl_regional,
      shipping_addl_metro: form.shipping_addl_metro,
      shipping_addl_national: form.shipping_addl_national,
      shipping_addl_special: form.shipping_addl_special,
      shipping_base_weight_kg: form.shipping_base_weight_kg,
      shipping_weight_step_kg: form.shipping_weight_step_kg,
      delivery_charge_free_above: form.delivery_charge_free_above,
      delivery_email_charge: form.delivery_email_charge,
      cod_extra_charge: form.cod_extra_charge,
      cod_enabled: form.cod_enabled ? '1' : '0',
      low_stock_threshold: form.low_stock_threshold,
    })
    toast('Shipping settings updated', 'success')
  }

  const baseKg = liveRates.shipping_base_weight_kg
  const stepKg = liveRates.shipping_weight_step_kg

  return (
    <div className="max-w-4xl pb-20">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Truck size={20} />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Shipping & Delivery Charges</h1>
            <p className="text-sm text-text-secondary">Zone rates plus a weight-based surcharge for heavier parcels.</p>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live rules
        </span>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Defined Zones', value: String(ZONES.length), icon: Map },
          { label: 'Base Weight', value: `${baseKg} kg`, icon: Scale },
          { label: 'Extra Slab', value: `${stepKg} kg`, icon: Scale },
          { label: 'Free Shipping', value: `> ${formatINR(Number(form.delivery_charge_free_above) || 0)}`, icon: Gift },
        ].map((k) => (
          <div key={k.label} className="rounded-card bg-bg-card p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">{k.label}</span>
              <k.icon size={15} className="text-accent" />
            </div>
            <p className="mt-1.5 truncate text-xl font-bold text-text-primary">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <Card icon={MapPin} title="Dispatch Origin" subtitle="Used to work out which zone a customer's address falls into.">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Origin Pincode" value={form.store_pincode} onChange={(e) => set('store_pincode', e.target.value)} maxLength={6} />
            <Input label="Origin State" value={form.store_state} onChange={(e) => set('store_state', e.target.value)} />
          </div>
        </Card>

        <Card
          icon={Scale}
          title="Weight Rule"
          subtitle="Each product has a weight (set on the product page). A zone's base rate covers the base weight; every further slab adds that zone's surcharge."
        >
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Base weight covered by zone rate (kg)"
              type="number"
              step="0.1"
              min="0"
              value={form.shipping_base_weight_kg}
              onChange={(e) => set('shipping_base_weight_kg', e.target.value)}
            />
            <Input
              label="Extra weight slab size (kg)"
              type="number"
              step="0.1"
              min="0.1"
              value={form.shipping_weight_step_kg}
              onChange={(e) => set('shipping_weight_step_kg', e.target.value)}
            />
          </div>
        </Card>

        <Card icon={Map} title="Zones & Rates (₹)" subtitle={`Base rate covers up to ${baseKg} kg. The surcharge is added per extra ${stepKg} kg (or part of it).`}>
          <div className="flex flex-col gap-3">
            {ZONES.map(({ zone, hint }, i) => (
              <div key={zone} className="rounded-xl bg-bg-elevated p-3.5">
                <div className="mb-2.5 flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-text-primary">
                    <span className="mr-2 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent">Zone {i + 1}</span>
                    {ZONE_LABELS[zone]}
                  </p>
                </div>
                <p className="mb-2.5 text-xs text-text-secondary">{hint}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={`Base rate (0 – ${baseKg} kg)`}
                    type="number"
                    value={form[`shipping_zone_${zone}` as keyof typeof form] as string}
                    onChange={(e) => set(`shipping_zone_${zone}` as keyof typeof form, e.target.value as never)}
                  />
                  <Input
                    label={`Addl. ${stepKg} kg surcharge`}
                    type="number"
                    value={form[`shipping_addl_${zone}` as keyof typeof form] as string}
                    onChange={(e) => set(`shipping_addl_${zone}` as keyof typeof form, e.target.value as never)}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card icon={Calculator} title="Rate Calculator" subtitle="Preview what a customer will pay for a parcel, using the values above (even before saving).">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Destination zone" value={calcZone} onChange={(e) => setCalcZone(e.target.value as ShippingZone)}>
              {ZONES.map(({ zone }) => (
                <option key={zone} value={zone}>
                  {ZONE_LABELS[zone]}
                </option>
              ))}
            </Select>
            <Input label="Total parcel weight (kg)" type="number" step="0.1" min="0" value={calcWeight} onChange={(e) => setCalcWeight(e.target.value)} />
          </div>
          <div className="rounded-xl bg-bg-elevated p-4 text-sm">
            <div className="flex justify-between py-1 text-text-secondary">
              <span>Base rate (up to {baseKg} kg)</span>
              <span>{formatINR(calcBase)}</span>
            </div>
            <div className="flex justify-between py-1 text-text-secondary">
              <span>
                Extra weight: {calcSlabs} × {stepKg} kg slab{calcSlabs === 1 ? '' : 's'}
              </span>
              <span>{formatINR(calcTotal - calcBase)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-border pt-3 text-base font-bold text-text-primary">
              <span>Customer pays for shipping</span>
              <span>{formatINR(calcTotal)}</span>
            </div>
            {Number(form.delivery_charge_free_above) > 0 && (
              <p className="mt-2 text-xs text-text-muted">Waived for orders of {formatINR(Number(form.delivery_charge_free_above))} or more.</p>
            )}
          </div>
        </Card>

        <Card icon={Gift} title="Policies" subtitle="Free-shipping threshold, email delivery and cash on delivery.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Free Shipping Above (₹)"
              type="number"
              value={form.delivery_charge_free_above}
              onChange={(e) => set('delivery_charge_free_above', e.target.value)}
            />
            <Input
              label="Email Delivery Charge (₹)"
              type="number"
              value={form.delivery_email_charge}
              onChange={(e) => set('delivery_email_charge', e.target.value)}
            />
            <Input label="COD Extra Charge (₹)" type="number" value={form.cod_extra_charge} onChange={(e) => set('cod_extra_charge', e.target.value)} />
            <Input
              label="Low Stock Alert Threshold"
              type="number"
              value={form.low_stock_threshold}
              onChange={(e) => set('low_stock_threshold', e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-text-primary">
            <input type="checkbox" checked={form.cod_enabled} onChange={(e) => set('cod_enabled', e.target.checked)} className="accent-accent" />
            Enable Cash on Delivery
          </label>
          <p className="flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2 text-xs text-accent">
            <Mail size={14} className="shrink-0" /> Digital (email-delivered) items have no weight, so weight surcharges never apply to them.
          </p>
        </Card>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-20 flex justify-end border-t border-border bg-bg-card/95 px-4 py-3 backdrop-blur md:static md:mt-5 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <Button onClick={handleSave} disabled={updateSettings.isPending} className="w-full md:w-fit">
          <Save size={16} /> {updateSettings.isPending ? 'Saving...' : 'Save Shipping Settings'}
        </Button>
      </div>
    </div>
  )
}
