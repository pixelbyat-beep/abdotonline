import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthProvider'
import { supabase } from '@/lib/supabaseClient'
import { toast } from '@/store/toastStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function AdminLogin() {
  const { user, isAdmin, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user && isAdmin) return <Navigate to="/admin" replace />

  async function handleSubmit() {
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (error) {
      toast('Invalid email or password', 'error')
      return
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-main px-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-bg-card p-7">
        <div className="mb-6 flex flex-col items-center">
          <ShieldCheck className="mb-2 text-accent" size={32} />
          <h1 className="text-lg font-bold text-text-primary">AbDotStore Admin</h1>
          <p className="text-sm text-text-secondary">Sign in to manage your store</p>
        </div>
        <div className="flex flex-col gap-3">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button fullWidth size="lg" className="mt-2" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </div>
      </div>
    </div>
  )
}
