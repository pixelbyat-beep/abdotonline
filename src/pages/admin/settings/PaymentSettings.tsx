import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { useUpdateSettings } from '@/hooks/useAdminSettings'
import { toast } from '@/store/toastStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function PaymentSettings() {
  const { data: settings } = useSettings()
  const updateSettings = useUpdateSettings()
  const [keyId, setKeyId] = useState('')

  useEffect(() => {
    if (settings) setKeyId(settings.razorpay_key_id)
  }, [settings])

  async function handleSave() {
    await updateSettings.mutateAsync({ razorpay_key_id: keyId })
    toast('Razorpay Key ID updated', 'success')
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-xl font-bold text-text-primary">Payment Settings</h1>
      <div className="flex flex-col gap-4 rounded-card border border-border bg-bg-card p-5">
        <Input label="Razorpay Key ID (public)" value={keyId} onChange={(e) => setKeyId(e.target.value)} placeholder="rzp_live_xxxxxxxx" />
        <Button onClick={handleSave} disabled={updateSettings.isPending} className="w-fit">
          {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="mt-4 flex gap-3 rounded-card border border-warning/30 bg-warning/5 p-4 text-sm text-text-secondary">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" />
        <p>
          Your Razorpay <strong className="text-text-primary">Key Secret</strong> is never entered here — it must be set as a Supabase
          Edge Function secret for security:
          <br />
          <code className="mt-1 block rounded bg-bg-elevated px-2 py-1 text-xs">
            supabase secrets set RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=...
          </code>
        </p>
      </div>
    </div>
  )
}
