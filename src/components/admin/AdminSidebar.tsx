import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
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
  LayoutTemplate,
  ChevronDown,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { AdminLogo } from './AdminLogo'

interface NavChild {
  label: string
  href: string
  end?: boolean
}

interface NavGroup {
  label: string
  icon: LucideIcon
  href?: string
  end?: boolean
  children?: NavChild[]
}

const NAV: NavGroup[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin', end: true },
  {
    label: 'Orders',
    icon: ShoppingCart,
    children: [
      { label: 'All Orders', href: '/admin/orders', end: true },
      { label: 'Email Orders', href: '/admin/orders/email' },
      { label: 'Courier Orders', href: '/admin/orders/courier' },
      { label: 'Pending', href: '/admin/orders/pending' },
      { label: 'Cancelled', href: '/admin/orders/cancelled' },
    ],
  },
  {
    label: 'License Keys',
    icon: KeyRound,
    children: [
      { label: 'All Keys', href: '/admin/license-keys', end: true },
      { label: 'Add Keys', href: '/admin/license-keys/add' },
      { label: 'Low Stock', href: '/admin/license-keys/low-stock' },
    ],
  },
  {
    label: 'Catalog',
    icon: Package,
    children: [
      { label: 'Products', href: '/admin/products', end: true },
      { label: 'Categories', href: '/admin/products/categories' },
    ],
  },
  {
    label: 'Customers',
    icon: Users,
    children: [
      { label: 'All Customers', href: '/admin/customers', end: true },
      { label: 'Blocked', href: '/admin/customers/blocked' },
    ],
  },
  {
    label: 'Payments',
    icon: CreditCard,
    children: [
      { label: 'All Payments', href: '/admin/payments', end: true },
      { label: 'Pending', href: '/admin/payments/pending' },
      { label: 'Refunds', href: '/admin/payments/refunds' },
      { label: 'COD Orders', href: '/admin/payments/cod' },
    ],
  },
  {
    label: 'Shipping',
    icon: Truck,
    children: [
      { label: 'Courier Orders', href: '/admin/shipping', end: true },
      { label: 'Add Tracking', href: '/admin/shipping/tracking-add' },
    ],
  },
  { label: 'Home Page', icon: LayoutTemplate, href: '/admin/homepage', end: true },
  { label: 'Coupons & Deals', icon: Tag, href: '/admin/coupons', end: true },
  {
    label: 'Reviews',
    icon: Star,
    children: [
      { label: 'Pending', href: '/admin/reviews', end: true },
      { label: 'Approved', href: '/admin/reviews/approved' },
    ],
  },
  { label: 'Enquiries', icon: MessageSquare, href: '/admin/enquiries', end: true },
  {
    label: 'Reports',
    icon: BarChart3,
    children: [
      { label: 'Sales', href: '/admin/reports/sales' },
      { label: 'Revenue', href: '/admin/reports/revenue' },
      { label: 'Products', href: '/admin/reports/products' },
    ],
  },
  {
    label: 'Blogs',
    icon: FileText,
    children: [
      { label: 'All Blogs', href: '/admin/blogs', end: true },
      { label: 'Add Blog', href: '/admin/blogs/new' },
    ],
  },
  {
    label: 'Settings',
    icon: Settings,
    children: [
      { label: 'Store', href: '/admin/settings', end: true },
      { label: 'Payment', href: '/admin/settings/payment' },
      { label: 'Email', href: '/admin/settings/email' },
      { label: 'Shipping Charges', href: '/admin/settings/shipping' },
      { label: 'Admin Users', href: '/admin/settings/users' },
    ],
  },
]

function isChildActive(pathname: string, child: NavChild): boolean {
  return child.end ? pathname === child.href : pathname.startsWith(child.href)
}

function isGroupActive(pathname: string, group: NavGroup): boolean {
  if (group.href) return group.end ? pathname === group.href : pathname.startsWith(group.href)
  return group.children?.some((c) => isChildActive(pathname, c)) ?? false
}

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const [openLabel, setOpenLabel] = useState<string | null>(() => NAV.find((g) => g.children && isGroupActive(pathname, g))?.label ?? null)

  useEffect(() => {
    const activeGroup = NAV.find((g) => g.children && isGroupActive(pathname, g))
    if (activeGroup) setOpenLabel(activeGroup.label)
  }, [pathname])

  return (
    <div className="flex h-full w-64 flex-col overflow-y-auto border-r border-border bg-bg-card scrollbar-thin">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-4">
        <AdminLogo subtitle="Admin Console" />
        {onNavigate && (
          <button onClick={onNavigate} className="rounded-lg p-1.5 text-text-secondary hover:bg-bg-elevated md:hidden">
            <X size={20} />
          </button>
        )}
      </div>
      <nav className="flex-1 px-2.5 py-3">
        {NAV.map((group) => {
          const active = isGroupActive(pathname, group)

          if (!group.children) {
            return (
              <NavLink
                key={group.label}
                to={group.href!}
                end={group.end}
                onClick={onNavigate}
                className={cn(
                  'mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors',
                  active ? 'bg-accent/10 font-semibold text-accent' : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
                )}
              >
                <group.icon size={17} strokeWidth={2} />
                {group.label}
              </NavLink>
            )
          }

          const open = openLabel === group.label

          return (
            <div key={group.label} className="mb-0.5">
              <button
                onClick={() => setOpenLabel(open ? null : group.label)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors',
                  active ? 'bg-accent/10 font-semibold text-accent' : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
                )}
              >
                <group.icon size={17} strokeWidth={2} />
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown size={14} className={cn('shrink-0 transition-transform', open && 'rotate-180')} />
              </button>
              {open && (
                <div className="mt-0.5 ml-[22px] flex flex-col gap-0.5 border-l-2 border-border pl-3">
                  {group.children.map((child) => (
                    <NavLink
                      key={child.href}
                      to={child.href}
                      end={child.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'rounded-lg px-3 py-2 text-[13px] transition-colors',
                          isActive ? 'bg-accent/10 font-semibold text-accent' : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
                        )
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
}
