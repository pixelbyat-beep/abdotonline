import { useState } from 'react'
import { Mail, Phone, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useSettings } from '@/hooks/useSettings'
import { toast } from '@/store/toastStore'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function Contact() {
  const { data: settings } = useSettings()
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email) || !form.message.trim()) {
      toast('Please fill in your name, a valid email, and a message', 'error')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.from('enquiries').insert(form)
    setSubmitting(false)
    if (error) {
      toast('Could not send your message. Please try again.', 'error')
      return
    }
    toast("Thanks! We'll get back to you shortly.", 'success')
    setForm({ name: '', email: '', phone: '', message: '' })
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-6">
      <h1 className="mb-2 text-2xl font-bold text-text-primary">Contact Us</h1>
      <p className="mb-8 text-sm text-text-secondary">Have a question about an order or a product? We're here to help.</p>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-3 rounded-card border border-border bg-bg-card p-5">
          <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Textarea label="Message" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <Button onClick={handleSubmit} disabled={submitting} className="mt-2">
            {submitting ? 'Sending...' : 'Send Message'}
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-card border border-border bg-bg-card p-4">
            <Phone size={18} className="mt-0.5 text-accent" />
            <div>
              <p className="text-sm font-medium text-text-primary">Call Us</p>
              <p className="text-sm text-text-secondary">{settings?.store_phone}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-card border border-border bg-bg-card p-4">
            <Mail size={18} className="mt-0.5 text-accent" />
            <div>
              <p className="text-sm font-medium text-text-primary">Email Us</p>
              <p className="text-sm text-text-secondary">{settings?.store_email}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-card border border-border bg-bg-card p-4">
            <MapPin size={18} className="mt-0.5 text-accent" />
            <div>
              <p className="text-sm font-medium text-text-primary">Based in</p>
              <p className="text-sm text-text-secondary">India</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
