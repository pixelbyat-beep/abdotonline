import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAdminBlogs, useDeleteBlog } from '@/hooks/useAdminBlogs'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/formatters'
import type { Blog } from '@/types/domain'

export default function AllBlogs() {
  const { data, isLoading } = useAdminBlogs()
  const deleteBlog = useDeleteBlog()
  const navigate = useNavigate()

  const columns: Column<Blog>[] = [
    { header: 'Title', render: (b) => b.title },
    { header: 'Status', render: (b) => <Badge tone={b.status === 'published' ? 'success' : 'neutral'}>{b.status}</Badge> },
    { header: 'Created', render: (b) => formatDate(b.created_at) },
    {
      header: 'Actions',
      render: (b) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (confirm(`Delete "${b.title}"?`)) deleteBlog.mutate(b.id)
          }}
          className="text-danger hover:underline"
        >
          Delete
        </button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Blogs & Articles</h1>
        <Link to="/admin/blogs/new">
          <Button><Plus size={15} /> Add Blog Post</Button>
        </Link>
      </div>
      <DataTable columns={columns} rows={data ?? []} isLoading={isLoading} keyFn={(b) => b.id} onRowClick={(b) => navigate(`/admin/blogs/${b.id}`)} />
    </div>
  )
}
