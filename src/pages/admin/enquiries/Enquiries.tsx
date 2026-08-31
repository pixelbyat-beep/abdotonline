import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { formatDateTime } from '@/lib/formatters'
import type { Enquiry } from '@/types/domain'

export default function Enquiries() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'enquiries'],
    queryFn: async () => {
      const { data, error } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Enquiry['status'] }) => {
      const { error } = await supabase.from('enquiries').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'enquiries'] }),
  })

  const columns: Column<Enquiry>[] = [
    { header: 'Name', render: (e) => e.name },
    { header: 'Email', render: (e) => e.email },
    { header: 'Phone', render: (e) => e.phone ?? '—' },
    { header: 'Message', render: (e) => <span className="line-clamp-2 max-w-xs text-text-secondary">{e.message}</span> },
    { header: 'Date', render: (e) => formatDateTime(e.created_at) },
    {
      header: 'Status',
      render: (e) => (
        <select
          value={e.status}
          onChange={(ev) => updateStatus.mutate({ id: e.id, status: ev.target.value as Enquiry['status'] })}
          onClick={(ev) => ev.stopPropagation()}
          className="rounded-btn border border-border bg-bg-main px-2 py-1 text-xs text-text-primary"
        >
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
        </select>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-text-primary">Contact Enquiries</h1>
      <DataTable columns={columns} rows={data ?? []} isLoading={isLoading} keyFn={(e) => e.id} />
    </div>
  )
}
