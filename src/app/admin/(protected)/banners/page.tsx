'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Banner = { id: string; image_url: string; link_url: string | null; sort_order: number }

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [showForm, setShowForm] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')

  async function ensureTable() {
    // Banners table created lazily on first use via migration; if not present, this will just no-op fail silently on select.
  }

  async function load() {
    const { data } = await supabase.from('banners').select('*').order('sort_order')
    setBanners((data as Banner[]) || [])
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSave() {
    await supabase.from('banners').insert({ image_url: imageUrl, link_url: linkUrl || null, sort_order: banners.length })
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
        <button onClick={() => setShowForm(true)} className="bg-green-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5">
          <Plus size={16} /> Add Banner
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {banners.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <img src={b.image_url} alt="banner" className="w-full h-32 object-cover" />
            <div className="p-3 flex justify-between items-center">
              <p className="text-xs text-slate-400 truncate">{b.link_url || 'No link'}</p>
              <button onClick={() => handleDelete(b.id)} className="text-red-500">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {banners.length === 0 && (
          <p className="text-sm text-slate-400 col-span-2 text-center py-8">
            કોઈ banner નથી. નોંધ: 'banners' table હજુ database માં બનાવવાનું બાકી છે.
          </p>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg">Add Banner</h2>
              <button onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <input
              placeholder="Image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            />
            <input
              placeholder="Link URL (optional)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            />
            <button onClick={handleSave} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl">
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
