import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral'

const toneClasses: Record<Tone, string> = {
  accent: 'bg-accent/15 text-accent',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
  neutral: 'bg-text-primary/10 text-text-secondary',
}

export function Badge({ tone = 'neutral', className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium', toneClasses[tone], className)}
      {...props}
    />
  )
}
