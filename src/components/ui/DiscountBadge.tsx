export function DiscountBadge({ pct }: { pct: number }) {
  if (!pct || pct <= 0) return null
  return (
    <span className="inline-flex items-center rounded bg-accent px-2 py-0.5 text-xs font-bold text-black">
      {pct}% OFF
    </span>
  )
}
