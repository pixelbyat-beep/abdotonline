import { formatINR } from '@/lib/formatters'

export function PriceTag({
  price,
  originalPrice,
  size = 'md',
}: {
  price: number
  originalPrice?: number | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const priceClass = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-lg'
  return (
    <div className="flex items-baseline gap-2">
      <span className={`font-bold text-text-primary ${priceClass}`}>{formatINR(price)}</span>
      {originalPrice && originalPrice > price && (
        <span className="text-xs text-text-muted line-through">{formatINR(originalPrice)}</span>
      )}
    </div>
  )
}
