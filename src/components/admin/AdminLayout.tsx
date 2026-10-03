import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, ExternalLink, LogOut, LayoutDashboard, ShoppingCart, KeyRound, Package, Settings, type LucideIcon } from 'lucide-react'
import { AdminSidebar } from './AdminSidebar'
import { AdminLogo } from './AdminLogo'
import { useAuth } from '@/context/AuthProvider'
import { Toaster } from '@/components/ui/Toaster'
import { cn } from '@/lib/cn'

const BOTTOM_NAV: { label: string; href: string; icon: LucideIcon; end?: boolean }[] = [
  { label: 'Home', href: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Keys', href: '/admin/license-keys', icon: KeyRound },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const { pathname } = useLocation()
  const initials = (profile?.name || 'Admin').trim().slice(0, 1).toUpperCase()

  return (
    <div className="admin-theme flex min-h-screen bg-bg-main font-sans">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <div className="sticky top-0 h-screen">
          <AdminSidebar />
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-[#0b1c30]/50 backdrop-blur-[2px]" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 h-full shadow-2xl">
            <AdminSidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-bg-header/85 px-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl md:px-6">
          <button onClick={() => setDrawerOpen(true)} className="-ml-2 flex h-11 w-11 items-center justify-center rounded-lg text-text-primary hover:bg-bg-elevated md:hidden">
            <Menu size={22} />
          </button>
          <AdminLogo className="md:hidden" />
          <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live
          </span>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-accent"
          >
            View Store <ExternalLink size={12} />
          </a>
          <div className="flex items-center gap-2 border-l border-border pl-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-on-accent shadow-sm">
              {initials}
            </span>
            <span className="hidden text-sm font-medium text-text-primary sm:inline">{profile?.name || profile?.role}</span>
            <button onClick={signOut} title="Logout" className="rounded-lg p-1.5 text-text-secondary hover:bg-danger/10 hover:text-danger">
              <LogOut size={16} />
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-bg-card/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-xl md:hidden">
        {BOTTOM_NAV.map((item) => {
          const active = item.end ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn('flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium', active ? 'text-accent' : 'text-text-muted')}
            >
              <span className={cn('flex h-7 w-12 items-center justify-center rounded-full transition-colors', active && 'bg-accent/10')}>
                <item.icon size={19} strokeWidth={active ? 2.4 : 2} />
              </span>
              {item.label}
            </NavLink>
          )
        })}
      </nav>
      <Toaster />
    </div>
  )
}
