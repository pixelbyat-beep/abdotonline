import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'
import { cn } from '@/lib/cn'

const icons = {
  success: <CheckCircle2 size={18} className="text-success" />,
  error: <XCircle size={18} className="text-danger" />,
  info: <Info size={18} className="text-accent" />,
}

export function Toaster() {
  const { toasts, dismiss } = useToastStore()

  return (
    <div className="fixed bottom-20 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 md:bottom-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-center gap-2.5 rounded-card border border-border bg-bg-card px-4 py-3 text-sm text-text-primary shadow-xl',
          )}
        >
          {icons[t.tone]}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="text-text-muted hover:text-text-primary">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
