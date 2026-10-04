export const STORE_NAME = 'AbDotStore'
export const STORE_TAGLINE = 'Smart. Secure. Genuine.'

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Categories', href: '/listing' },
  { label: 'Deals', href: '/listing?filter=deals' },
  { label: 'New Arrivals', href: '/listing?filter=new' },
  { label: 'All Products', href: '/listing' },
  { label: 'Support', href: '/contact' },
] as const

export const CATEGORY_ICON_MAP: Record<string, string> = {
  'shield-check': 'ShieldCheck',
  shield: 'Shield',
  'globe-lock': 'Globe',
  'app-window': 'AppWindow',
  calculator: 'Calculator',
  server: 'Server',
  'gamepad-2': 'Gamepad2',
}

export const RAZORPAY_CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'
