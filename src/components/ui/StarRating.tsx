import { Star } from 'lucide-react'
import { cn } from '@/lib/cn'

export function StarRating({
  rating,
  count,
  size = 14,
  className,
}: {
  rating: number
  count?: number
  size?: number
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={size}
            className={i < Math.round(rating) ? 'fill-accent text-accent' : 'fill-transparent text-border'}
          />
        ))}
      </div>
      {typeof count === 'number' && <span className="text-xs text-text-secondary">({count})</span>}
    </div>
  )
}
