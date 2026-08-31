import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { toast } from '@/store/toastStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

export default function Auth() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const navigate = useNavigate()
  const location = useLocation()

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit() {
    if (!form.email || !form.password) {
      toast('Please enter your email and password', 'error')
      return
    }
    setLoading(true)
    try {
      if (tab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
        if (error) throw error
        toast('Welcome back!', 'success')
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { name: form.name, phone: form.phone } },
        })
        if (error) throw error
        toast('Account created! You can now check out and track orders faster.', 'success')
      }
      const from = (location.state as { from?: string })?.from ?? '/account'
      navigate(from)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Something went wrong', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 md:px-6">
      <h1 className="text-center text-2xl font-bold text-text-primary">
        Ab<span className="text-accent">Dot</span>Store
      </h1>
      <p className="mt-1 text-center text-sm text-text-secondary">
        An account is optional — you can always check out and track orders using just your email.
      </p>

      <div className="mt-8 flex rounded-btn border border-border p-1">
        <button
          onClick={() => setTab('login')}
          className={cn('flex-1 rounded-btn py-2 text-sm font-medium', tab === 'login' ? 'bg-accent text-black' : 'text-text-secondary')}
        >
          Login
        </button>
        <button
          onClick={() => setTab('register')}
          className={cn('flex-1 rounded-btn py-2 text-sm font-medium', tab === 'register' ? 'bg-accent text-black' : 'text-text-secondary')}
        >
          Register
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {tab === 'register' && (
          <>
            <Input label="Full Name" value={form.name} onChange={(e) => update('name', e.target.value)} />
            <Input label="Phone Number" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </>
        )}
        <Input label="Email Address" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
        <Input label="Password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} />

        <Button fullWidth size="lg" className="mt-2" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Please wait...' : tab === 'login' ? 'Login' : 'Create Account'}
        </Button>
      </div>
    </div>
  )
}
