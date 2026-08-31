import { ShieldCheck, Shield, Globe, AppWindow, Calculator, Server, Gamepad2, Package, type LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  'shield-check': ShieldCheck,
  shield: Shield,
  'globe-lock': Globe,
  'app-window': AppWindow,
  calculator: Calculator,
  server: Server,
  'gamepad-2': Gamepad2,
}

export function CategoryIcon({ icon, ...props }: { icon: string | null } & React.ComponentProps<LucideIcon>) {
  const Icon = (icon && ICON_MAP[icon]) || Package
  return <Icon {...props} />
}
