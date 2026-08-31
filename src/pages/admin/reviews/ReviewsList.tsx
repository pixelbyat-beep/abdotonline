import { useAdminReviews, useModerateReview } from '@/hooks/useAdminReviews'
import { StarRating } from '@/components/ui/StarRating'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/formatters'

export function ReviewsList({ status, title }: { status: 'pending' | 'approved'; title: string }) {
  const { data, isLoading } = useAdminReviews(status)
  const moderate = useModerateReview()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-text-primary">{title}</h1>
      {isLoading && <p className="text-text-secondary">Loading...</p>}
      {!isLoading && data?.length === 0 && <p className="text-text-secondary">No {status} reviews.</p>}
      <div className="flex flex-col gap-3">
        {data?.map((r) => (
          <div key={r.id} className="rounded-card border border-border bg-bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">{(r.products as unknown as { name: string } | null)?.name}</p>
                <p className="text-xs text-text-muted">{r.guest_name || 'Registered user'} · {formatDate(r.created_at)}</p>
              </div>
              <StarRating rating={r.rating} />
            </div>
            {r.comment && <p className="mt-2 text-sm text-text-secondary">{r.comment}</p>}
            {status === 'pending' && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => moderate.mutate({ id: r.id, status: 'approved' })}>Approve</Button>
                <Button size="sm" variant="danger" onClick={() => moderate.mutate({ id: r.id, status: 'rejected' })}>Reject</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
