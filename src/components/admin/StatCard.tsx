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
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium text-text-secondary">{label}</p>
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', toneClasses[tone])}>
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-2 truncate text-2xl font-bold tracking-tight text-text-primary">{value}</p>
    </>
  )

  const className = 'flex flex-col rounded-card bg-bg-card p-4 transition-shadow'

  if (href) {
    return (
      <Link to={href} className={cn(className, 'hover:shadow-md')}>
        {content}
      </Link>
    )
  }
  return <div className={className}>{content}</div>
}
