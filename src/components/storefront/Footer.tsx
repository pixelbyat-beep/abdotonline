import { Link } from 'react-router-dom'
import { STORE_TAGLINE } from '@/lib/constants'
import { LogoMark } from './Logo'

const categories = [
  { name: 'Total Security', slug: 'total-security' },
  { name: 'Antivirus', slug: 'antivirus' },
  { name: 'Internet Security', slug: 'internet-security' },
  { name: 'Windows', slug: 'windows' },
  { name: 'Accounting Solutions', slug: 'accounting-solutions' },
  { name: 'Server Security', slug: 'server-security' },
  { name: 'Gaming', slug: 'gaming' },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-header pb-20 pt-12 md:pb-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 md:grid-cols-5 md:px-6">
        <div className="col-span-2 md:col-span-1">
          <span className="flex items-center gap-2">
            <LogoMark />
            <span className="text-lg font-bold text-accent">AbDotStore</span>
          </span>
          <p className="mt-2 text-sm text-accent">{STORE_TAGLINE}</p>
          <p className="mt-3 text-sm text-text-secondary">
            Your trusted destination for genuine software and digital products.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-text-primary">Quick Links</h4>
          <ul className="flex flex-col gap-2 text-sm text-text-secondary">
            <li><Link to="/about" className="hover:text-accent">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-accent">Contact</Link></li>
            <li><Link to="/listing" className="hover:text-accent">All Products</Link></li>
            <li><Link to="/listing?filter=deals" className="hover:text-accent">Deals</Link></li>
            <li><Link to="/listing?filter=new" className="hover:text-accent">New Arrivals</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-text-primary">Customer Support</h4>
          <ul className="flex flex-col gap-2 text-sm text-text-secondary">
            <li><Link to="/contact" className="hover:text-accent">Help Center</Link></li>
            <li><Link to="/track-order" className="hover:text-accent">Track Order</Link></li>
            <li><Link to="/refund-policy" className="hover:text-accent">Returns &amp; Refunds</Link></li>
            <li><Link to="/contact" className="hover:text-accent">Contact Support</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-text-primary">Policies</h4>
          <ul className="flex flex-col gap-2 text-sm text-text-secondary">
            <li><Link to="/privacy-policy" className="hover:text-accent">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-accent">Terms &amp; Conditions</Link></li>
            <li><Link to="/shipping-policy" className="hover:text-accent">Shipping Policy</Link></li>
            <li><Link to="/refund-policy" className="hover:text-accent">Refund Policy</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-text-primary">Categories</h4>
          <ul className="flex flex-col gap-2 text-sm text-text-secondary">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link to={`/listing?category=${c.slug}`} className="hover:text-accent">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-border px-4 pt-6 text-center text-xs text-text-muted md:px-6">
        © {new Date().getFullYear()} AbDotStore. All Rights Reserved.
      </div>
    </footer>
  )
}
