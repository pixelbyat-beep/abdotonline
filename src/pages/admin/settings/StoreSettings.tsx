import { useEffect, useState } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { useUpdateSettings } from '@/hooks/useAdminSettings'
import { toast } from '@/store/toastStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function StoreSettings() {
  const { data: settings } = useSettings()
  const updateSettings = useUpdateSettings()
  const [form, setForm] = useState({ store_name: '', store_phone: '', store_email: '' })

  useEffect(() => {
    if (settings) setForm({ store_name: settings.store_name, store_phone: settings.store_phone, store_email: settings.store_email })
  }, [settings])

  async function handleSave() {
    await updateSettings.mutateAsync(form)
    toast('Store settings updated', 'success')
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-xl font-bold text-text-primary">Store Settings</h1>
      <div className="flex flex-col gap-4 rounded-card border border-border bg-bg-card p-5">
        <Input label="Store Name" value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} />
        <Input label="Store Phone" value={form.store_phone} onChange={(e) => setForm({ ...form, store_phone: e.target.value })} />
        <Input label="Store Email" value={form.store_email} onChange={(e) => setForm({ ...form, store_email: e.target.value })} />
        <Button onClick={handleSave} disabled={updateSettings.isPending} className="w-fit">
          {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
