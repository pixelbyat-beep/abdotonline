import type { LucideIcon } from 'lucide-react'

export function StatCard({ label, value, icon: Icon, tone = 'accent' }: { label: string; value: string; icon: LucideIcon; tone?: 'accent' | 'warning' | 'danger' }) {
  const toneClass = tone === 'warning' ? 'text-warning bg-warning/10' : tone === 'danger' ? 'text-danger bg-danger/10' : 'text-accent bg-accent/10'
  return (
    <div className="flex items-center gap-4 rounded-card border border-border bg-bg-card p-5">
      <div className={`flex h-11 w-11 items-center justify-center rounded-full ${toneClass}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="text-xl font-bold text-text-primary">{value}</p>
      </div>
    </div>
  )
}
