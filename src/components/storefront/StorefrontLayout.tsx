import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { BottomNav } from './BottomNav'
import { Toaster } from '@/components/ui/Toaster'

export function StorefrontLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-main">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
      <Toaster />
    </div>
  )
}
