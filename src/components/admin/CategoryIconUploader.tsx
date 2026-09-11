import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { supabase, publicImageUrl } from '@/lib/supabaseClient'
import { toast } from '@/store/toastStore'
import { CategoryIcon, isCategoryImageIcon } from '@/lib/categoryIcons'

const MAX_SIZE_MB = 2
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']

export function CategoryIconUploader({ value, onChange }: { value: string | null; onChange: (path: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast('Only JPG, PNG, WEBP, or SVG icons are allowed', 'error')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast(`Icon must be under ${MAX_SIZE_MB}MB`, 'error')
      return
    }
    setUploading(true)
    const path = `categories/${Date.now()}-${file.name.replace(/\s+/g, '-')}`
    const { error } = await supabase.storage.from('store-assets').upload(path, file)
    setUploading(false)
    if (error) {
      toast('Failed to upload icon', 'error')
      return
    }
    onChange(path)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-bg-main text-text-secondary">
        {value ? (
          isCategoryImageIcon(value) ? (
            <img src={publicImageUrl(value)} alt="" className="h-full w-full object-contain p-1.5" />
          ) : (
            <CategoryIcon icon={value} size={24} />
          )
        ) : (
          <CategoryIcon icon={null} size={24} />
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-btn border border-dashed border-border px-3 py-1.5 text-xs text-text-secondary hover:border-accent hover:text-accent"
          >
            <Upload size={13} /> {uploading ? 'Uploading...' : value ? 'Change Icon' : 'Upload Icon'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="flex items-center gap-1 rounded-btn px-2 py-1.5 text-xs text-danger hover:bg-danger/10"
            >
              <X size={13} /> Remove
            </button>
          )}
        </div>
        <span className="text-[11px] text-text-muted">JPG, PNG, WEBP or SVG. Shown on the storefront &ldquo;Browse Categories&rdquo; section.</span>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" hidden onChange={(e) => handleFile(e.target.files)} />
    </div>
  )
}
