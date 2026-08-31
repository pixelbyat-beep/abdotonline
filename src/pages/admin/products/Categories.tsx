import { useState } from 'react'
import { useAdminCategories, useSaveCategory, useDeleteCategory } from '@/hooks/useAdminCategories'
import { slugify } from '@/lib/formatters'
import { toast } from '@/store/toastStore'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Category } from '@/types/domain'

const EMPTY = { name: '', description: '', icon: '' }

export default function AdminCategories() {
  const { data, isLoading } = useAdminCategories()
  const saveCategory = useSaveCategory()
  const deleteCategory = useDeleteCategory()
  const [form, setForm] = useState(EMPTY)

  async function handleAdd() {
    if (!form.name.trim()) {
      toast('Category name is required', 'error')
      return
    }
    await saveCategory.mutateAsync({ name: form.name, slug: slugify(form.name), description: form.description, icon: form.icon })
    setForm(EMPTY)
    toast('Category added', 'success')
  }

  const columns: Column<Category>[] = [
    { header: 'Name', render: (c) => c.name },
    { header: 'Slug', render: (c) => <span className="text-text-secondary">{c.slug}</span> },
    { header: 'Description', render: (c) => <span className="text-text-secondary">{c.description}</span> },
    {
      header: 'Status',
      render: (c) => (
        <button onClick={() => saveCategory.mutate({ id: c.id, status: c.status === 'active' ? 'inactive' : 'active' })}>
          <Badge tone={c.status === 'active' ? 'success' : 'neutral'}>{c.status}</Badge>
        </button>
      ),
    },
    {
      header: 'Actions',
      render: (c) => (
        <button
          onClick={() => confirm(`Delete ${c.name}?`) && deleteCategory.mutate(c.id)}
          className="text-danger hover:underline"
        >
          Delete
        </button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-text-primary">Categories</h1>

      <div className="rounded-card border border-border bg-bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-text-primary">Add Category</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input placeholder="Icon key (e.g. shield)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          <Button onClick={handleAdd}>Add</Button>
        </div>
      </div>

      <DataTable columns={columns} rows={data ?? []} isLoading={isLoading} keyFn={(c) => c.id} />
    </div>
  )
}
