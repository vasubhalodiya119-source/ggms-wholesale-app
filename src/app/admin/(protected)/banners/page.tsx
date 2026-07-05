'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, X, Link as LinkIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ImageUploadField from '@/components/ImageUploadField'

type Banner = { id: string; image_url: string; link_url: string | null; sort_order: number }

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [showForm, setShowForm] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')

  async function load() {
    const { data } = await supabase.from('banners').select('*').order('sort_order')
    setBanners((data as Banner[]) || [])
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!imageUrl) return
    await supabase.from('banners').insert({
      image_url: imageUrl,
      link_url: linkUrl || null,
      sort_order: banners.length,
    })
    setShowForm(false)
    setImageUrl('')
    setLinkUrl('')
    load()
  }

  async function handleDelete(id: string) {
    await supabase.from('banners').delete().eq('id', id)
    load()
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-900">Ad Slider Banners ({banners.length})</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5"
        >
          <Plus size={16} /> Add Banner
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {banners.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.image_url} alt="banner" className="w-full h-36 object-cover" />
            <div className="p-3 flex justify-between items-center">
              <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                <LinkIcon size={11} /> {b.link_url || 'No link'}
              </p>
              <button onClick={() => handleDelete(b.id)} className="text-red-500 ml-2 flex-shrink-0">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {banners.length === 0 && (
          <p className="text-sm text-slate-400 col-span-2 text-center py-8">
            કોઈ banner નથી — Add Banner button thi ઉmErvI
          </p>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg">Banner ઉmErvI</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>

            {/* Gallery Upload */}
            <ImageUploadField
              label="Banner Image (Gallery thi upload)"
              value={imageUrl || null}
              onChange={(url) => setImageUrl(url)}
              hint="Gallery mathi photo select karo ya camera thi levo"
            />

            {/* OR URL paste */}
            <div className="relative">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center">
                <div className="flex-1 border-t border-slate-200" />
                <span className="px-2 text-xs text-slate-400">અથવા URL paste karo</span>
                <div className="flex-1 border-t border-slate-200" />
              </div>
            </div>
            <div className="pt-3">
              <input
                placeholder="https://... (Image URL)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
              />
            </div>

            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="preview" className="w-full h-28 object-cover rounded-xl border border-slate-100" />
            )}

            <input
              placeholder="Link URL (optional) - click karta j khulse"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            />

            <button
              onClick={handleSave}
              disabled={!imageUrl}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-xl disabled:opacity-50"
            >
              Save Banner
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
