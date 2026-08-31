import { useRef, useState } from 'react'
import { Upload, X, Star } from 'lucide-react'
import { supabase, publicImageUrl } from '@/lib/supabaseClient'
import { toast } from '@/store/toastStore'
import type { ProductImage } from '@/types/domain'

const MAX_SIZE_MB = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function ImageUploader({
  productId,
  images,
  onChange,
}: {
  productId: string
  images: ProductImage[]
  onChange: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast(`${file.name}: only JPG, PNG, or WEBP allowed`, 'error')
        continue
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast(`${file.name}: must be under ${MAX_SIZE_MB}MB`, 'error')
        continue
      }
      const path = `products/${productId}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`
      const { error: uploadError } = await supabase.storage.from('store-assets').upload(path, file)
      if (uploadError) {
        toast(`Failed to upload ${file.name}`, 'error')
        continue
      }
      await supabase.from('product_images').insert({
        product_id: productId,
        storage_path: path,
        is_primary: images.length === 0,
      })
    }
    setUploading(false)
    onChange()
    if (inputRef.current) inputRef.current.value = ''
  }

  async function setPrimary(imageId: string) {
    await supabase.from('product_images').update({ is_primary: false }).eq('product_id', productId)
    await supabase.from('product_images').update({ is_primary: true }).eq('id', imageId)
    onChange()
  }

  async function removeImage(imageId: string) {
    await supabase.from('product_images').delete().eq('id', imageId)
    onChange()
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3">
        {images.map((img) => (
          <div key={img.id} className="group relative h-24 w-24 overflow-hidden rounded-btn border border-border">
            <img src={publicImageUrl(img.storage_path)} alt="" className="h-full w-full object-cover" />
            {img.is_primary && (
              <span className="absolute left-1 top-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-black">Primary</span>
            )}
            <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
              {!img.is_primary && (
                <button onClick={() => setPrimary(img.id)} className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30" title="Set primary">
                  <Star size={13} />
                </button>
              )}
              <button onClick={() => removeImage(img.id)} className="rounded-full bg-white/20 p-1.5 text-white hover:bg-danger/60" title="Delete">
                <X size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 rounded-btn border border-dashed border-border px-4 py-2.5 text-sm text-text-secondary hover:border-accent hover:text-accent"
      >
        <Upload size={15} /> {uploading ? 'Uploading...' : 'Upload Images'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
