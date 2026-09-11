import { ShieldCheck, Shield, Globe, AppWindow, Calculator, Server, Gamepad2, Package, type LucideIcon } from 'lucide-react'
import { publicImageUrl } from '@/lib/supabaseClient'

const ICON_MAP: Record<string, LucideIcon> = {
  'shield-check': ShieldCheck,
  shield: Shield,
  'globe-lock': Globe,
  'app-window': AppWindow,
  calculator: Calculator,
  server: Server,
  'gamepad-2': Gamepad2,
}

/** A category `icon` value is either an uploaded image (storage path / URL) or a legacy icon key from ICON_MAP. */
export function isCategoryImageIcon(icon: string | null): boolean {
  return !!icon && !(icon in ICON_MAP)
}

export function CategoryIcon({ icon, size = 24, className }: { icon: string | null; size?: number; className?: string }) {
  if (isCategoryImageIcon(icon)) {
    return <img src={publicImageUrl(icon!)} alt="" style={{ width: size, height: size }} className={`rounded object-contain ${className ?? ''}`} />
  }
  const Icon = (icon && ICON_MAP[icon]) || Package
  return <Icon size={size} className={className} />
}
