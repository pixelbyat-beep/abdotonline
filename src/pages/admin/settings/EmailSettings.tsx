import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useUpdateSettings } from '@/hooks/useAdminSettings'
import { toast } from '@/store/toastStore'
import { supabase } from '@/lib/supabaseClient'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function EmailSettings() {
  const { data: fromEmailRow, refetch } = useQuery({
    queryKey: ['setting', 'resend_from_email'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'resend_from_email').single()
      return data?.value ?? ''
    },
  })
  const updateSettings = useUpdateSettings()
  const [fromEmail, setFromEmail] = useState('')

  useEffect(() => {
    if (fromEmailRow) setFromEmail(fromEmailRow)
  }, [fromEmailRow])

  async function handleSave() {
    await updateSettings.mutateAsync({ resend_from_email: fromEmail })
    toast('Sender email updated', 'success')
    refetch()
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-xl font-bold text-text-primary">Email Settings</h1>
      <div className="flex flex-col gap-4 rounded-card border border-border bg-bg-card p-5">
        <Input label="Sender Email Address" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="orders@yourdomain.com" />
        <Button onClick={handleSave} disabled={updateSettings.isPending} className="w-fit">
          {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="mt-4 flex gap-3 rounded-card border border-warning/30 bg-warning/5 p-4 text-sm text-text-secondary">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" />
        <p>
          Emails are sent via Resend. Your Resend <strong className="text-text-primary">API key</strong> must be set as a Supabase Edge
          Function secret — it is never stored in this database:
          <br />
          <code className="mt-1 block rounded bg-bg-elevated px-2 py-1 text-xs">supabase secrets set RESEND_API_KEY=...</code>
          Also verify your sending domain in the Resend dashboard before going live.
        </p>
      </div>
    </div>
  )
}
