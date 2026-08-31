import { useAdminCustomers, useToggleCustomerBlock } from '@/hooks/useAdminCustomers'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/formatters'
import type { Profile } from '@/types/domain'

export function CustomersList({ blockedOnly, title }: { blockedOnly: boolean; title: string }) {
  const { data, isLoading } = useAdminCustomers(blockedOnly)
  const toggleBlock = useToggleCustomerBlock()

  const columns: Column<Profile>[] = [
    { header: 'Name', render: (c) => c.name ?? '—' },
    { header: 'Phone', render: (c) => c.phone ?? '—' },
    { header: 'Joined', render: (c) => formatDate(c.created_at) },
    {
      header: 'Status',
      render: (c) => <Badge tone={c.blocked ? 'danger' : 'success'}>{c.blocked ? 'Blocked' : 'Active'}</Badge>,
    },
    {
      header: 'Actions',
      render: (c) => (
        <button
          onClick={() => toggleBlock.mutate({ id: c.id, blocked: !c.blocked })}
          className={c.blocked ? 'text-success hover:underline' : 'text-danger hover:underline'}
        >
          {c.blocked ? 'Unblock' : 'Block'}
        </button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-text-primary">{title}</h1>
      <DataTable columns={columns} rows={data ?? []} isLoading={isLoading} keyFn={(c) => c.id} />
    </div>
  )
}
