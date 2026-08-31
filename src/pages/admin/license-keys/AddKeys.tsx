import { useState } from 'react'
import { useAllProductsBasic } from '@/hooks/useAdminProducts'
import { useAddLicenseKeys } from '@/hooks/useLicenseKeys'
import { toast } from '@/store/toastStore'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function AddKeys() {
  const { data: products } = useAllProductsBasic()
  const addKeys = useAddLicenseKeys()
  const [productId, setProductId] = useState('')
  const [keysText, setKeysText] = useState('')

  const emailProducts = products?.filter((p) => p.delivery_type === 'email' || p.delivery_type === 'both')

  async function handleSave() {
    const keys = keysText
      .split('\n')
      .map((k) => k.trim())
      .filter(Boolean)
    if (!productId) {
      toast('Please select a product', 'error')
      return
    }
    if (keys.length === 0) {
      toast('Please paste at least one license key', 'error')
      return
    }
    await addKeys.mutateAsync({ productId, keys })
    toast(`${keys.length} license key(s) added`, 'success')
    setKeysText('')
  }

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <h1 className="text-xl font-bold text-text-primary">Add License Keys</h1>
      <div className="rounded-card border border-border bg-bg-card p-5">
        <div className="flex flex-col gap-4">
          <Select label="Product" value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">Select a product</option>
            {emailProducts?.map((p) => (
              <option key={p.id} value={p.id}>{p.brand} — {p.name}</option>
            ))}
          </Select>
          <Textarea
            label="License Keys (one per line)"
            rows={10}
            value={keysText}
            onChange={(e) => setKeysText(e.target.value)}
            placeholder={'XXXXX-XXXXX-XXXXX\nXXXXX-XXXXX-XXXXX'}
          />
          <Button onClick={handleSave} disabled={addKeys.isPending}>
            {addKeys.isPending ? 'Saving...' : 'Save Keys'}
          </Button>
        </div>
      </div>
    </div>
  )
}
