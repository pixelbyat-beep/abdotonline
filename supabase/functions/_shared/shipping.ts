/**
 * Server-side mirror of src/lib/shipping.ts — kept in sync manually since edge functions
 * run on Deno and can't import from the Vite app. See that file for the rationale behind
 * the zone model (a configurable approximation of Blue Dart-style tiered pricing).
 */

export type ShippingZone = 'local' | 'regional' | 'metro' | 'national' | 'special'

const METRO_PREFIXES = new Set(['110', '400', '700', '600', '560', '500', '411', '380'])
const SPECIAL_2 = new Set(['18', '19'])
const SPECIAL_3 = new Set(['737', '744', '781', '782', '783', '784', '785', '786', '787', '788', '790', '791', '792', '793', '794', '795', '796', '797', '798', '799'])

export function resolveShippingZone(destPincode: string, originPincode: string, destState: string, originState: string): ShippingZone {
  const destP3 = destPincode.slice(0, 3)
  const originP3 = originPincode.slice(0, 3)

  if (destP3 && destP3 === originP3) return 'local'
  if (destState.trim().toLowerCase() === originState.trim().toLowerCase() && destState.trim() !== '') return 'regional'
  if (SPECIAL_3.has(destP3) || SPECIAL_2.has(destPincode.slice(0, 2))) return 'special'
  if (METRO_PREFIXES.has(destP3) && METRO_PREFIXES.has(originP3)) return 'metro'
  return 'national'
}

export interface ShippingZoneRates {
  shipping_zone_local: number
  shipping_zone_regional: number
  shipping_zone_metro: number
  shipping_zone_national: number
  shipping_zone_special: number
}

export function shippingChargeForZone(zone: ShippingZone, rates: ShippingZoneRates): number {
  switch (zone) {
    case 'local':
      return rates.shipping_zone_local
    case 'regional':
      return rates.shipping_zone_regional
    case 'metro':
      return rates.shipping_zone_metro
    case 'special':
      return rates.shipping_zone_special
    case 'national':
    default:
      return rates.shipping_zone_national
  }
}
