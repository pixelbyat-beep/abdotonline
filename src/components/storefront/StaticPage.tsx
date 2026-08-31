import type { ReactNode } from 'react'

export function StaticPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">{title}</h1>
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-text-secondary [&_h2]:mt-6 [&_h2]:mb-1 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-text-primary">
        {children}
      </div>
    </div>
  )
}
