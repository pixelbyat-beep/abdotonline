// deno-lint-ignore-file no-explicit-any
type AdminClient = any

async function getFromEmail(admin: AdminClient): Promise<string> {
  const { data } = await admin.from('settings').select('value').eq('key', 'resend_from_email').single()
  return data?.value || 'orders@abdotstore.com'
}

async function sendViaResend(to: string, subject: string, html: string, from: string): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    console.error('RESEND_API_KEY not set — skipping email send. Configure it with: supabase secrets set RESEND_API_KEY=...')
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: `AbDotStore <${from}>`, to: [to], subject, html }),
  })
  if (!res.ok) {
    console.error('Resend API error:', await res.text())
  }
}

interface OrderItemForEmail {
  product_name_snapshot: string
  qty: number
  price: number
  license_keys?: { key_value: string } | null
}

export async function sendLicenseKeyEmail(
  admin: AdminClient,
  order: { order_number: string; guest_name: string | null; guest_email: string | null; total: number },
  items: OrderItemForEmail[],
  customMessage?: string,
): Promise<void> {
  if (!order.guest_email) return
  const from = await getFromEmail(admin)

  const keysHtml = items
    .filter((i) => i.license_keys?.key_value)
    .map(
      (i) => `
      <div style="margin:12px 0;padding:14px;background:#141414;border:1px solid #2a2a2a;border-radius:8px;">
        <p style="margin:0 0 6px;color:#a0a0a0;font-size:13px;">${i.product_name_snapshot}</p>
        <p style="margin:0;font-family:monospace;font-size:16px;color:#19D9F2;font-weight:bold;">${i.license_keys!.key_value}</p>
      </div>`,
    )
    .join('')

  // The admin writes this each time they send — falls back to a generic line if left blank.
  const defaultMessage = `Thank you for your order <strong>#${order.order_number}</strong>! Here ${items.length > 1 ? 'are' : 'is'} your license key${items.length > 1 ? 's' : ''}:`
  const messageHtml = customMessage
    ? customMessage
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .map((line) => `<p>${line}</p>`)
        .join('')
    : `<p>${defaultMessage}</p>`

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px 24px;">
      <h1 style="color:#19D9F2;font-size:20px;">AbDotStore</h1>
      <p>Hi ${order.guest_name || 'there'},</p>
      ${messageHtml}
      ${keysHtml}
      <p style="color:#a0a0a0;font-size:13px;">Please keep this email safe — your license key is single-use. If you have any trouble activating it, reply to this email or visit our support page.</p>
      <p style="margin-top:24px;">— The AbDotStore Team<br/><em>Smart. Secure. Genuine.</em></p>
    </div>`

  await sendViaResend(order.guest_email, `Your AbDotStore license key — Order #${order.order_number}`, html, from)
}

export async function sendOrderConfirmationEmail(
  admin: AdminClient,
  order: {
    order_number: string
    guest_name: string | null
    guest_email: string | null
    total: number
    delivery_type: string
  },
): Promise<void> {
  if (!order.guest_email) return
  const from = await getFromEmail(admin)

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px 24px;">
      <h1 style="color:#19D9F2;font-size:20px;">AbDotStore</h1>
      <p>Hi ${order.guest_name || 'there'},</p>
      <p>Your order <strong>#${order.order_number}</strong> has been confirmed. Total paid: <strong>₹${order.total}</strong>.</p>
      ${
        order.delivery_type === 'courier'
          ? '<p>We are preparing your package for shipment. You will receive a tracking number by email and WhatsApp once it ships.</p>'
          : '<p>Your license key is on its way in a separate email.</p>'
      }
      <p>You can track your order anytime using your Order Number and this email address on our Track Order page.</p>
      <p style="margin-top:24px;">— The AbDotStore Team<br/><em>Smart. Secure. Genuine.</em></p>
    </div>`

  await sendViaResend(order.guest_email, `Order Confirmed — #${order.order_number}`, html, from)
}
