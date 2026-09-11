import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, ExternalLink, LogOut } from 'lucide-react'
import { AdminSidebar } from './AdminSidebar'
import { useAuth } from '@/context/AuthProvider'
import { Toaster } from '@/components/ui/Toaster'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const initials = (profile?.name || 'Admin').trim().slice(0, 1).toUpperCase()

  return (
    <div className="flex min-h-screen bg-bg-main">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <AdminSidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-bg-header px-4 py-3 md:px-6">
          <button onClick={() => setDrawerOpen(true)} className="text-text-primary md:hidden">
            <Menu size={22} />
          </button>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-accent"
          >
            View Store <ExternalLink size={12} />
          </a>
          <ThemeToggle />
          <div className="flex items-center gap-2 border-l border-border pl-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
              {initials}
            </span>
            <span className="hidden text-sm text-text-secondary sm:inline">{profile?.name || profile?.role}</span>
            <button onClick={signOut} title="Logout" className="text-text-secondary hover:text-danger">
              <LogOut size={16} />
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  )
}
