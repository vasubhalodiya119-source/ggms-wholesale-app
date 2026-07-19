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

function compressImage(file: File, maxWidth = 800, maxHeight = 800, quality = 0.8): Promise<Blob | File> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              resolve(file)
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => resolve(file)
    }
    reader.onerror = () => resolve(file)
  })
}

export default function ImageUploadField({ value, onChange, label, hint }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const originalFile = e.target.files?.[0]
    if (!originalFile) return

    setError('')
    setUploading(true)

    // Compress image before upload to ensure small file size (under 100KB) for push notifications and fast loading
    let fileToUpload: File | Blob = originalFile
    if (originalFile.type.startsWith('image/')) {
      try {
        fileToUpload = await compressImage(originalFile, 1024, 1024, 0.75)
      } catch (err) {
        console.error('Failed to compress image:', err)
      }
    }

    const ext = originalFile.name.split('.').pop() || 'jpg'
    const fileName = `${crypto.randomUUID()}.${ext}`
    const path = `uploads/${fileName}`

    const { error: uploadError } = await supabase.storage.from('public-assets').upload(path, fileToUpload, {
      cacheControl: '3600',
      upsert: false,
      contentType: originalFile.type
    })

    if (uploadError) {
      console.error('Upload error details:', uploadError)
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
