import { useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { useAdminCategories, useSaveCategory, useDeleteCategory } from '@/hooks/useAdminCategories'
import { slugify } from '@/lib/formatters'
import { toast } from '@/store/toastStore'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { CategoryIconUploader } from '@/components/admin/CategoryIconUploader'
import { CategoryIcon } from '@/lib/categoryIcons'
import { Badge } from '@/components/ui/Badge'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { Category } from '@/types/domain'

const EMPTY = { id: undefined as string | undefined, name: '', description: '', icon: null as string | null }

export default function AdminCategories() {
  const { data, isLoading } = useAdminCategories()
  const saveCategory = useSaveCategory()
  const deleteCategory = useDeleteCategory()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)

  function openAdd() {
    setForm(EMPTY)
    setOpen(true)
  }

  function openEdit(c: Category) {
    setForm({ id: c.id, name: c.name, description: c.description ?? '', icon: c.icon })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast('Category name is required', 'error')
      return
    }
    await saveCategory.mutateAsync({
      id: form.id,
      name: form.name,
      slug: slugify(form.name),
      description: form.description,
      icon: form.icon,
    })
    setOpen(false)
    toast(form.id ? 'Category updated' : 'Category added', 'success')
  }

  const columns: Column<Category>[] = [
    { header: 'Icon', render: (c) => <CategoryIcon icon={c.icon} size={28} /> },
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
        <div className="flex items-center gap-3">
          <button onClick={() => openEdit(c)} className="flex items-center gap-1 text-accent hover:underline">
            <Pencil size={13} /> Edit
          </button>
          <button
            onClick={() => confirm(`Delete ${c.name}?`) && deleteCategory.mutate(c.id)}
            className="text-danger hover:underline"
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-text-primary">Categories</h1>
        <Button onClick={openAdd}>
          <Plus size={15} /> Add Category
        </Button>
      </div>

      <DataTable columns={columns} rows={data ?? []} isLoading={isLoading} keyFn={(c) => c.id} emptyMessage="No categories yet." />

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'Edit Category' : 'Add Category'} maxWidth="max-w-lg">
        <div className="flex flex-col gap-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          <div>
            <p className="mb-1.5 text-sm text-text-secondary">Category Icon</p>
            <CategoryIconUploader value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
          </div>
          <div className="mt-2 flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveCategory.isPending}>
              {saveCategory.isPending ? 'Saving...' : form.id ? 'Save Changes' : 'Add Category'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
