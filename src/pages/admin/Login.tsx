import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ShieldCheck, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '@/context/AuthProvider'
import { supabase } from '@/lib/supabaseClient'
import { toast } from '@/store/toastStore'
import { AdminLogo } from '@/components/admin/AdminLogo'
import { Toaster } from '@/components/ui/Toaster'

export default function AdminLogin() {
  const { user, isAdmin, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user && isAdmin) return <Navigate to="/admin" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (error) {
      toast('Invalid email or password', 'error')
      return
    }
  }

  const fieldClass =
    'flex items-center gap-3 rounded-xl bg-bg-elevated px-4 py-3 ring-1 ring-transparent transition focus-within:bg-bg-card focus-within:ring-accent'

  return (
    <div className="admin-theme flex min-h-screen flex-col items-center justify-center bg-bg-main px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <AdminLogo />
          <p className="mt-3 text-sm text-text-secondary">Smart shopping. Genuine products.</p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            <ShieldCheck size={13} /> Secure E-Commerce Administration Console
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Welcome back, Administrator</h1>
        <p className="mb-5 mt-1 text-sm text-text-secondary">Enter your verified credentials to access the store management environment.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl bg-bg-card p-6 shadow-[0_2px_16px_rgba(11,28,48,0.08)]">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-text-primary">Admin Work Email</span>
            <span className={fieldClass}>
              <Mail size={18} className="shrink-0 text-text-muted" />
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@abdotstore.com"
                className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
            </span>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-text-primary">Admin Password</span>
            <span className={fieldClass}>
              <Lock size={18} className="shrink-0 text-text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="shrink-0 text-text-muted hover:text-text-primary" aria-label="Toggle password visibility">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-on-accent shadow-sm transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn size={17} /> {submitting ? 'Signing in...' : 'Sign In to Admin Console'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-text-muted">Authorized personnel only. Access attempts are recorded and audited.</p>
      </div>
      <Toaster />
    </div>
  )
}
