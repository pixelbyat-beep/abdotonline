import { StaticPage } from '@/components/storefront/StaticPage'

export default function PrivacyPolicy() {
  return (
    <StaticPage title="Privacy Policy">
      <p>We collect only the information needed to process your order: name, email, phone number, and — for courier delivery — your shipping address.</p>
      <h2>How we use your information</h2>
      <p>Your email is used to send order confirmations and license keys. Your phone number may be used by our team to send delivery updates via WhatsApp.</p>
      <h2>Payment information</h2>
      <p>All payments are processed securely by Razorpay. We never store your card, UPI, or net banking details on our servers.</p>
      <h2>Data sharing</h2>
      <p>We do not sell or share your personal information with third parties, except courier partners for order delivery.</p>
      <h2>Contact</h2>
      <p>For any privacy-related questions, please reach out via our Contact page.</p>
    </StaticPage>
  )
}
