import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { CategoryIcon } from '@/lib/categoryIcons'
import { Skeleton } from '@/components/ui/Skeleton'

export function CategoryGrid() {
  const { data: categories, isLoading } = useCategories()

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary md:text-2xl">Browse Categories</h2>
          <p className="mt-1 text-sm text-text-secondary">Find the exact tools you need.</p>
        </div>
        <Link
          to="/listing"
          className="group hidden shrink-0 items-center gap-1 text-xs font-semibold tracking-wide text-accent hover:text-accent-dark sm:flex"
        >
          VIEW ALL
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4 lg:grid-cols-7">
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-28" />)
          : categories?.map((cat) => (
              <Link
                key={cat.id}
                to={`/listing?category=${cat.slug}`}
                className="group relative flex flex-col items-center gap-3 overflow-hidden rounded-card border border-border bg-bg-card p-4 text-center transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-bg-main text-text-secondary transition-colors group-hover:bg-accent/10 group-hover:text-accent">
                  <CategoryIcon icon={cat.icon} size={26} />
                </div>
                <span className="text-sm font-medium text-text-primary">{cat.name}</span>
              </Link>
            ))}
      </div>
    </section>
  )
}
