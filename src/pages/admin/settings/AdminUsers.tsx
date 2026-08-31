import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, edgeFunctionUrl } from '@/lib/supabaseClient'
import { toast } from '@/store/toastStore'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/formatters'
import type { Profile } from '@/types/domain'

export default function AdminUsers() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').in('role', ['admin', 'staff']).order('created_at')
      if (error) throw error
      return data
    },
  })

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' as 'admin' | 'staff' })
  const [submitting, setSubmitting] = useState(false)

  async function handleInvite() {
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email) || form.password.length < 6) {
      toast('Please provide a name, valid email, and a password (6+ chars)', 'error')
      return
    }
    setSubmitting(true)
    const { data: sessionData } = await supabase.auth.getSession()
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    const res = await fetch(edgeFunctionUrl('admin-create-staff'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${sessionData.session?.access_token}` },
      body: JSON.stringify(form),
    })
    setSubmitting(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast(body.error || 'Could not create user', 'error')
      return
    }
    toast('Admin user created', 'success')
    setForm({ name: '', email: '', password: '', role: 'staff' })
    queryClient.invalidateQueries({ queryKey: ['admin', 'admin-users'] })
  }

  const columns: Column<Profile>[] = [
    { header: 'Name', render: (p) => p.name ?? '—' },
    { header: 'Role', render: (p) => <Badge tone={p.role === 'admin' ? 'accent' : 'neutral'}>{p.role}</Badge> },
    { header: 'Joined', render: (p) => formatDate(p.created_at) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-text-primary">Admin Users</h1>

      <div className="rounded-card border border-border bg-bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-text-primary">Add Admin / Staff User</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1fr_140px_auto]">
          <Input placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'staff' })}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </Select>
          <Button onClick={handleInvite} disabled={submitting}>Add</Button>
        </div>
      </div>

      <DataTable columns={columns} rows={data ?? []} isLoading={isLoading} keyFn={(p) => p.id} />
    </div>
  )
}
