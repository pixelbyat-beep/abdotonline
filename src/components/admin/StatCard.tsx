import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral'

const toneClasses: Record<Tone, string> = {
  accent: 'text-accent bg-accent/10',
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
  danger: 'text-danger bg-danger/10',
  neutral: 'text-text-secondary bg-text-primary/5',
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'accent',
  href,
}: {
  label: string
  value: string
  icon: LucideIcon
  tone?: Tone
  href?: string
}) {
  const content = (
    <>
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', toneClasses[tone])}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] leading-tight text-text-secondary">{label}</p>
        <p className="mt-1 truncate text-lg font-bold text-text-primary">{value}</p>
      </div>
    </>
  )

  const className = 'flex items-center gap-3 rounded-card border border-border bg-bg-card p-4 transition-colors'

  if (href) {
    return (
      <Link to={href} className={cn(className, 'hover:border-accent/40 hover:bg-bg-elevated')}>
        {content}
      </Link>
    )
  }
  return <div className={className}>{content}</div>
}
