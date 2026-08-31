import { useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Search, Heart, ShoppingCart, User, Menu, X } from 'lucide-react'
import { STORE_TAGLINE, NAV_LINKS } from '@/lib/constants'
import { useCartStore, cartCount } from '@/store/cartStore'
import { useAuth } from '@/context/AuthProvider'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LogoMark } from './Logo'

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const { user } = useAuth()
  const count = cartCount(items)

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg-header/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
        {/* Mobile: hamburger */}
        <button className="text-text-primary md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu size={24} />
        </button>

        <Link to="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="flex flex-col">
            <span className="text-xl font-bold text-accent">AbDotStore</span>
            <span className="hidden text-[10px] uppercase tracking-widest text-text-secondary md:block">{STORE_TAGLINE}</span>
          </span>
        </Link>

        {/* Desktop search */}
        <form onSubmit={handleSearch} className="mx-auto hidden max-w-xl flex-1 md:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search software, antivirus, Windows..."
              className="w-full rounded-full border border-border bg-bg-card py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0 md:gap-3">
          <button onClick={() => navigate('/search')} className="text-text-primary md:hidden" aria-label="Search">
            <Search size={22} />
          </button>
          <ThemeToggle className="hidden md:block" />
          <Link
            to="/wishlist"
            className="hidden rounded-full p-2 text-text-primary hover:bg-bg-elevated md:block"
            aria-label="Wishlist"
          >
            <Heart size={20} />
          </Link>
          <Link to="/cart" className="relative rounded-full p-2 text-text-primary hover:bg-bg-elevated" aria-label="Cart">
            <ShoppingCart size={20} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-black">
                {count}
              </span>
            )}
          </Link>
          <Link
            to={user ? '/account' : '/auth'}
            className="hidden rounded-full p-2 text-text-primary hover:bg-bg-elevated md:block"
            aria-label="Account"
          >
            <User size={20} />
          </Link>
        </div>
      </div>

      {/* Desktop nav bar */}
      <nav className="hidden border-t border-border bg-bg-main/40 md:block">
        <div className="mx-auto flex max-w-7xl items-center gap-7 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.href}
              end={link.href === '/'}
              className={({ isActive }) =>
                isActive ? 'text-accent' : 'text-text-secondary transition-colors hover:text-text-primary'
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Mobile drawer — portaled to <body> so it isn't clipped by the header's own
          backdrop-blur, which (per spec) makes the header a containing block for
          position:fixed descendants and would otherwise collapse this overlay to the
          header's own box instead of the full viewport. */}
      {mobileOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 bg-bg-header p-5">
              <div className="mb-6 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <LogoMark />
                  <span className="text-lg font-bold text-accent">AbDotStore</span>
                </span>
                <div className="flex items-center gap-1">
                  <ThemeToggle />
                  <button onClick={() => setMobileOpen(false)} className="text-text-primary">
                    <X size={22} />
                  </button>
                </div>
              </div>
              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.label}
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `rounded-btn px-3 py-2.5 text-sm ${isActive ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'}`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                <NavLink
                  to={user ? '/account' : '/auth'}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-btn px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                >
                  {user ? 'My Account' : 'Login / Register'}
                </NavLink>
                <NavLink
                  to="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-btn px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                >
                  Wishlist
                </NavLink>
                <NavLink
                  to="/track-order"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-btn px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                >
                  Track Order
                </NavLink>
              </nav>
            </div>
          </div>,
          document.body,
        )}
    </header>
  )
}
