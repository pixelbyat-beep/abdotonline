// Manual WhatsApp notify — PRD §6.5. Zero API, zero cost: builds a wa.me link with a
// pre-filled message and opens WhatsApp Web in a new tab. Admin still has to click Send.

export type WhatsAppTemplateKey =
  | 'order_confirmed'
  | 'license_key_sent'
  | 'tracking_update'
  | 'out_for_delivery'
  | 'delivered'

interface TemplateVars {
  name: string
  orderId: string
  product?: string
  amount?: string
  email?: string
  trackingNo?: string
  courier?: string
}

const TEMPLATES: Record<WhatsAppTemplateKey, (v: TemplateVars) => string> = {
  order_confirmed: (v) =>
    `Hi ${v.name}, your order #${v.orderId} for ${v.product} has been confirmed. Total: ${v.amount}. Thank you for shopping with AbDotStore!`,
  license_key_sent: (v) =>
    `Hi ${v.name}, your license key for ${v.product} has been sent to your email ${v.email}. Please check your inbox.`,
  tracking_update: (v) =>
    `Hi ${v.name}, your order #${v.orderId} has been shipped. Tracking No: ${v.trackingNo} via ${v.courier}. Track at: indiapost.gov.in`,
  out_for_delivery: (v) =>
    `Hi ${v.name}, your order #${v.orderId} is out for delivery today. Please be available at your address.`,
  delivered: (v) =>
    `Hi ${v.name}, your order #${v.orderId} has been delivered. Thank you for shopping with AbDotStore! Need help? Reply here.`,
}

export function buildWhatsAppLink(phone: string, template: WhatsAppTemplateKey, vars: TemplateVars): string {
  const digitsOnly = phone.replace(/\D/g, '')
  const withCountryCode = digitsOnly.startsWith('91') ? digitsOnly : `91${digitsOnly}`
  const message = TEMPLATES[template](vars)
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`
}

export function openWhatsAppNotify(phone: string, template: WhatsAppTemplateKey, vars: TemplateVars): void {
  window.open(buildWhatsAppLink(phone, template, vars), '_blank', 'noopener,noreferrer')
}
