import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'

export interface Column<T> {
  header: string
  render: (row: T) => ReactNode
  className?: string
}

export function DataTable<T>({
  columns,
  rows,
  isLoading,
  keyFn,
  emptyMessage = 'No records found.',
  onRowClick,
}: {
  columns: Column<T>[]
  rows: T[]
  isLoading?: boolean
  keyFn: (row: T) => string
  emptyMessage?: string
  onRowClick?: (row: T) => void
}) {
  return (
    <div className="overflow-x-auto rounded-card border border-border bg-bg-card">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
            {columns.map((col) => (
              <th key={col.header} className="px-4 py-3 font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {columns.map((col) => (
                  <td key={col.header} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-text-secondary">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={keyFn(row)}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-border last:border-0 hover:bg-bg-elevated/50 ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col) => (
                  <td key={col.header} className={`px-4 py-3 text-text-primary ${col.className ?? ''}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
