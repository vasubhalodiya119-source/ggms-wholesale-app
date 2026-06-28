'use client'

import { useRef, useState } from 'react'
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Props = {
  value: string | null
  onChange: (url: string) => void
  label?: string
  hint?: string
}

export default function ImageUploadField({ value, onChange, label, hint }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setUploading(true)

    const ext = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${ext}`
    const path = `uploads/${fileName}`

    const { error: uploadError } = await supabase.storage.from('public-assets').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (uploadError) {
      setError('અપલોડ કરવામાં ભૂલ થઈ')
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('public-assets').getPublicUrl(path)
    onChange(data.publicUrl)
    setUploading(false)
  }

  return (
    <div>
      {label && <label className="text-xs font-bold text-slate-500">{label}</label>}
      <div className="mt-1 flex items-center gap-3">
        <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={22} className="text-slate-300" />
          )}
        </div>
        <div className="flex-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl disabled:opacity-60"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Uploading...' : value ? 'Change Image' : 'Upload Image'}
          </button>
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          {hint && <p className="text-[11px] text-slate-400 mt-1.5">{hint}</p>}
          {error && <p className="text-[11px] text-red-500 mt-1.5">{error}</p>}
        </div>
      </div>
    </div>
  )
}
