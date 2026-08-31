import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAdminBlog, useSaveBlog } from '@/hooks/useAdminBlogs'
import { slugify } from '@/lib/formatters'
import { toast } from '@/store/toastStore'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

export default function AddEditBlog() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const { data: blog } = useAdminBlog(id)
  const saveBlog = useSaveBlog()
  const [form, setForm] = useState({ title: '', content: '', cover_image: '', status: 'draft' as 'draft' | 'published' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (blog) setForm({ title: blog.title, content: blog.content ?? '', cover_image: blog.cover_image ?? '', status: blog.status })
  }, [blog])

  async function handleSave() {
    if (!form.title.trim()) {
      toast('Title is required', 'error')
      return
    }
    setSaving(true)
    try {
      await saveBlog.mutateAsync({ id: isNew ? undefined : id, ...form, slug: slugify(form.title) })
      toast('Blog post saved', 'success')
      navigate('/admin/blogs')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-bold text-text-primary">{isNew ? 'Add Blog Post' : 'Edit Blog Post'}</h1>
      <div className="flex flex-col gap-4">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input label="Cover Image URL" value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} />
        <Textarea label="Content" rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'draft' | 'published' })}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </Select>
        <Button onClick={handleSave} disabled={saving} className="w-fit">
          {saving ? 'Saving...' : 'Save Blog Post'}
        </Button>
      </div>
    </div>
  )
}
