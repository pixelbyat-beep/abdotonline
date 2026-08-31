import { NavLink } from 'react-router-dom'
import { Home, Search, Grid2x2, Package, User } from 'lucide-react'

const items = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Categories', href: '/listing', icon: Grid2x2 },
  { label: 'Orders', href: '/track-order', icon: Package },
  { label: 'Profile', href: '/account', icon: User },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-bg-header/95 backdrop-blur md:hidden">
      {items.map(({ label, href, icon: Icon }) => (
        <NavLink
          key={label}
          to={href}
          end={href === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] ${isActive ? 'text-accent' : 'text-text-secondary'}`
          }
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
