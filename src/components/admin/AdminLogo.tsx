import { ShoppingBag, KeyRound } from 'lucide-react'
import { cn } from '@/lib/cn'

/** AbDotStore mark (shopping bag + licence key) with the two-tone wordmark from the admin design. */
export function AdminLogo({ className, subtitle }: { className?: string; subtitle?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-on-accent shadow-sm">
        <ShoppingBag size={18} strokeWidth={2.25} />
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-accent ring-1 ring-border">
          <KeyRound size={9} strokeWidth={2.75} />
        </span>
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-bold tracking-tight text-[#17376b]">
          AbDot<span className="text-[#0c8fc9]">Store</span>
        </span>
        {subtitle && <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">{subtitle}</span>}
      </span>
    </span>
  )
}
