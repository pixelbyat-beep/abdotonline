import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Small brand mark used before the "AbDotStore" wordmark in the header/footer. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/30',
        className,
      )}
    >
      <ShieldCheck size={17} strokeWidth={2.25} />
    </span>
  )
}
