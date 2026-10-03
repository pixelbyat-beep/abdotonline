import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { SettingsMap } from '@/types/domain'

const DEFAULTS: SettingsMap = {
  shipping_zone_local: 49,
  shipping_zone_regional: 79,
  shipping_zone_metro: 99,
  shipping_zone_national: 129,
  shipping_zone_special: 199,
  shipping_base_weight_kg: 0.5,
  shipping_weight_step_kg: 0.5,
  shipping_addl_local: 20,
  shipping_addl_regional: 30,
  shipping_addl_metro: 35,
  shipping_addl_national: 50,
  shipping_addl_special: 90,
  store_pincode: '400001',
  store_state: 'Maharashtra',
  delivery_charge_free_above: 999,
  delivery_email_charge: 0,
  cod_extra_charge: 30,
  cod_enabled: true,
  low_stock_threshold: 10,
  store_name: 'AbDotStore',
  store_phone: '',
  store_email: '',
  razorpay_key_id: '',
}

const NUMERIC_KEYS = new Set([
  'shipping_zone_local',
  'shipping_zone_regional',
  'shipping_zone_metro',
  'shipping_zone_national',
  'shipping_zone_special',
  'shipping_base_weight_kg',
  'shipping_weight_step_kg',
  'shipping_addl_local',
  'shipping_addl_regional',
  'shipping_addl_metro',
  'shipping_addl_national',
  'shipping_addl_special',
  'delivery_charge_free_above',
  'delivery_email_charge',
  'cod_extra_charge',
  'low_stock_threshold',
])

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<SettingsMap> => {
      const { data, error } = await supabase.from('settings').select('key, value')
      if (error) throw error

      const map = { ...DEFAULTS }
      for (const row of data ?? []) {
        const key = row.key as keyof SettingsMap
        if (row.value === null) continue
        if (key === 'cod_enabled') {
          ;(map as SettingsMap).cod_enabled = row.value === '1'
        } else if (NUMERIC_KEYS.has(key)) {
          ;(map as unknown as Record<string, number>)[key] = Number(row.value)
        } else {
          ;(map as unknown as Record<string, string>)[key] = row.value
        }
      }
      return map
    },
    staleTime: 5 * 60 * 1000,
  })
}
