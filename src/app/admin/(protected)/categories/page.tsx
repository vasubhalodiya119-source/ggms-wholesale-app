'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Category } from '@/lib/types'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', name_gujarati: '', image_url: '', sort_order: '0' })

  async function load() {
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    setCategories((data as Category[]) || [])
  }

  useEffect(() => {
    load()
  }, [])

  function openNew() {
    setEditing(null)
    setForm({ name: '', name_gujarati: '', image_url: '', sort_order: String(categories.length) })
    setShowForm(true)
  }

  function openEdit(c: Category) {
    setEditing(c)
    setForm({ name: c.name, name_gujarati: c.name_gujarati || '', image_url: c.image_url || '', sort_order: String(c.sort_order) })
    setShowForm(true)
  }

  async function handleSave() {
    const payload = {
      name: form.name,
      name_gujarati: form.name_gujarati || null,
      image_url: form.image_url || null,
      sort_order: parseInt(form.sort_order) || 0,
    }
    if (editing) {
      await supabase.from('categories').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('categories').insert(payload)
    }
    setShowForm(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('ડિલીટ કરવું છે? આ category ની બધી products પણ unlink થઈ જશે.')) return
    await supabase.from('categories').delete().eq('id', id)
    load()
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-900">Categories ({categories.length})</h1>
        <button onClick={openNew} className="bg-green-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5">
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {categories.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="font-bold text-slate-800 text-sm">{c.name}</p>
            {c.name_gujarati && <p className="text-xs text-slate-400">{c.name_gujarati}</p>}
            <div className="flex gap-3 mt-3">
              <button onClick={() => openEdit(c)} className="text-blue-500 text-xs font-bold flex items-center gap-1">
                <Pencil size={13} /> Edit
              </button>
              <button onClick={() => handleDelete(c.id)} className="text-red-500 text-xs font-bold flex items-center gap-1">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg">{editing ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <input
              placeholder="Category Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            />
            <input
              placeholder="ગુજરાતી નામ"
              value={form.name_gujarati}
              onChange={(e) => setForm({ ...form, name_gujarati: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            />
            <input
              placeholder="Image URL"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            />
            <input
              placeholder="Sort Order"
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
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
