import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  )

  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-primary transition-colors disabled:opacity-40 hover:border-accent hover:text-accent"
      >
        <ChevronLeft size={16} />
      </button>
      {pages.map((p, i) => (
        <div key={p} className="flex items-center gap-1.5">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="text-text-muted">…</span>}
          <button
            onClick={() => onChange(p)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full border text-sm transition-colors',
              p === page ? 'border-accent bg-accent text-black font-semibold' : 'border-border text-text-primary hover:border-accent',
            )}
          >
            {p}
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-primary transition-colors disabled:opacity-40 hover:border-accent hover:text-accent"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
