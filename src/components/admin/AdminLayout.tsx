import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, ExternalLink } from 'lucide-react'
import { AdminSidebar } from './AdminSidebar'
import { useAuth } from '@/context/AuthProvider'
import { Toaster } from '@/components/ui/Toaster'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { profile, signOut } = useAuth()

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

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-bg-header px-4 py-3 md:px-6">
          <button onClick={() => setDrawerOpen(true)} className="text-text-primary md:hidden">
            <Menu size={22} />
          </button>
          <span className="text-sm font-medium text-text-primary md:text-base">Admin Panel</span>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent"
          >
            View Store <ExternalLink size={12} />
          </a>
          <span className="hidden text-sm text-text-secondary sm:inline">{profile?.name || profile?.role}</span>
          <ThemeToggle />
          <button onClick={signOut} className="text-xs text-danger hover:underline">
            Logout
          </button>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  )
}
