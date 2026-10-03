/**
 * Zone-based courier pricing modeled on how surface couriers like Blue Dart tier their
 * rates: local (same city), regional (same state), metro-to-metro, rest of India, and a
 * special/remote tier for J&K, the North-East, and the islands. This is a configurable
 * approximation (rates come from `settings`, editable in the admin panel), not a live
 * Blue Dart API call — swap `resolveShippingZone`'s callers for a real rate-card fetch
 * later if the store gets Blue Dart merchant credentials.
 */

export type ShippingZone = 'local' | 'regional' | 'metro' | 'national' | 'special'

export const ZONE_LABELS: Record<ShippingZone, string> = {
  local: 'Local (same city)',
  regional: 'Regional (same state)',
  metro: 'Metro-to-metro',
  national: 'Rest of India',
  special: 'Special / remote area',
}

// First 3 digits of pincode for major metro postal circles.
const METRO_PREFIXES = new Set(['110', '400', '700', '600', '560', '500', '411', '380'])

// J&K (180-194) and the North-East + Andaman circles get the special/remote tier.
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
  /** Weight covered by the zone's base rate, in kg. */
  shipping_base_weight_kg: number
  /** Size of each extra weight slab beyond the base weight, in kg. */
  shipping_weight_step_kg: number
  shipping_addl_local: number
  shipping_addl_regional: number
  shipping_addl_metro: number
  shipping_addl_national: number
  shipping_addl_special: number
}

/** Fallback weight (kg) for a product or cart line that has none recorded. */
export const DEFAULT_ITEM_WEIGHT_KG = 0.5

export function zoneBaseRate(zone: ShippingZone, rates: ShippingZoneRates): number {
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

export function zoneAdditionalRate(zone: ShippingZone, rates: ShippingZoneRates): number {
  switch (zone) {
    case 'local':
      return rates.shipping_addl_local
    case 'regional':
      return rates.shipping_addl_regional
    case 'metro':
      return rates.shipping_addl_metro
    case 'special':
      return rates.shipping_addl_special
    case 'national':
    default:
      return rates.shipping_addl_national
  }
}

/** Number of extra weight slabs billed beyond the zone's base weight. */
export function extraWeightSlabs(totalWeightKg: number, rates: ShippingZoneRates): number {
  const step = rates.shipping_weight_step_kg > 0 ? rates.shipping_weight_step_kg : 0.5
  const over = totalWeightKg - rates.shipping_base_weight_kg
  // Round to 3 dp first so float noise (e.g. 1.0000000002 kg) can't bill a phantom slab.
  return over > 0.0005 ? Math.ceil(Math.round(over * 1000) / 1000 / step - 1e-9) : 0
}

/** Courier charge = zone base rate (covers the base weight) + per-slab surcharge for the extra weight. */
export function shippingChargeForZone(zone: ShippingZone, rates: ShippingZoneRates, totalWeightKg = 0): number {
  return zoneBaseRate(zone, rates) + extraWeightSlabs(totalWeightKg, rates) * zoneAdditionalRate(zone, rates)
}
