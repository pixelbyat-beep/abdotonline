import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  KeyRound,
  Package,
  Users,
  CreditCard,
  Truck,
  Tag,
  Star,
  MessageSquare,
  BarChart3,
  FileText,
  Settings,
  X,
} from 'lucide-react'
import { cn } from '@/lib/cn'

const NAV_SECTIONS = [
  {
    label: 'Dashboard',
    items: [{ label: 'Overview', href: '/admin', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Order Management',
    items: [
      { label: 'All Orders', href: '/admin/orders', icon: ShoppingCart, end: true },
      { label: 'Email Delivery', href: '/admin/orders/email', icon: ShoppingCart },
      { label: 'Courier Orders', href: '/admin/orders/courier', icon: ShoppingCart },
      { label: 'Pending', href: '/admin/orders/pending', icon: ShoppingCart },
      { label: 'Cancelled', href: '/admin/orders/cancelled', icon: ShoppingCart },
    ],
  },
  {
    label: 'License Keys',
    items: [
      { label: 'All Keys', href: '/admin/license-keys', icon: KeyRound, end: true },
      { label: 'Add Keys', href: '/admin/license-keys/add', icon: KeyRound },
      { label: 'Low Stock', href: '/admin/license-keys/low-stock', icon: KeyRound },
    ],
  },
  {
    label: 'Products',
    items: [
      { label: 'All Products', href: '/admin/products', icon: Package, end: true },
      { label: 'Add Product', href: '/admin/products/new', icon: Package },
      { label: 'Categories', href: '/admin/products/categories', icon: Package },
    ],
  },
  {
    label: 'Customers',
    items: [
      { label: 'All Customers', href: '/admin/customers', icon: Users, end: true },
      { label: 'Blocked', href: '/admin/customers/blocked', icon: Users },
    ],
  },
  {
    label: 'Payments',
    items: [
      { label: 'All Payments', href: '/admin/payments', icon: CreditCard, end: true },
      { label: 'Pending', href: '/admin/payments/pending', icon: CreditCard },
      { label: 'Refunds', href: '/admin/payments/refunds', icon: CreditCard },
      { label: 'COD Orders', href: '/admin/payments/cod', icon: CreditCard },
    ],
  },
  {
    label: 'Shipping',
    items: [
      { label: 'Courier Orders', href: '/admin/shipping', icon: Truck, end: true },
      { label: 'Add Tracking', href: '/admin/shipping/tracking-add', icon: Truck },
    ],
  },
  {
    label: 'Coupons & Deals',
    items: [{ label: 'All Coupons', href: '/admin/coupons', icon: Tag, end: true }],
  },
  {
    label: 'Reviews',
    items: [
      { label: 'Pending', href: '/admin/reviews', icon: Star, end: true },
      { label: 'Approved', href: '/admin/reviews/approved', icon: Star },
    ],
  },
  {
    label: 'Enquiries',
    items: [{ label: 'Contact Enquiries', href: '/admin/enquiries', icon: MessageSquare, end: true }],
  },
  {
    label: 'Reports',
    items: [
      { label: 'Sales', href: '/admin/reports/sales', icon: BarChart3 },
      { label: 'Revenue', href: '/admin/reports/revenue', icon: BarChart3 },
      { label: 'Products', href: '/admin/reports/products', icon: BarChart3 },
    ],
  },
  {
    label: 'Blogs',
    items: [
      { label: 'All Blogs', href: '/admin/blogs', icon: FileText, end: true },
      { label: 'Add Blog', href: '/admin/blogs/new', icon: FileText },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Store', href: '/admin/settings', icon: Settings, end: true },
      { label: 'Payment', href: '/admin/settings/payment', icon: Settings },
      { label: 'Email', href: '/admin/settings/email', icon: Settings },
      { label: 'Shipping Charges', href: '/admin/settings/shipping', icon: Settings },
      { label: 'Admin Users', href: '/admin/settings/users', icon: Settings },
    ],
  },
]

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full w-64 flex-col overflow-y-auto border-r border-border bg-bg-header scrollbar-thin">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <span className="text-lg font-bold text-text-primary">
          Ab<span className="text-accent">Dot</span>Store
        </span>
        {onNavigate && (
          <button onClick={onNavigate} className="text-text-primary md:hidden">
            <X size={20} />
          </button>
        )}
      </div>
      <nav className="flex-1 px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">{section.label}</p>
            {section.items.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-btn px-3 py-2 text-sm',
                    isActive ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
                  )
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </div>
  )
}
