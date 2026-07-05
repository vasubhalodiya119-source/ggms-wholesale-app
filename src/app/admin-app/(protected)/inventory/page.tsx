'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Product, Category } from '@/lib/types'
import ImageUploadField from '@/components/ImageUploadField'

export default function AdminAppInventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({ name: '', name_gujarati: '', category_id: '', price: '', unit: 'pcs', stock_qty: '', low_stock_threshold: '5', image_url: '' })

  async function load() {
    const { data: p } = await supabase.from('products').select('*').order('name')
    setProducts((p as Product[]) || [])
    const { data: c } = await supabase.from('categories').select('*').order('sort_order')
    setCategories((c as Category[]) || [])
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setEditing(null)
    setForm({ name: '', name_gujarati: '', category_id: categories[0]?.id || '', price: '', unit: 'pcs', stock_qty: '', low_stock_threshold: '5', image_url: '' })
    setShowForm(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({ name: p.name, name_gujarati: p.name_gujarati || '', category_id: p.category_id || '', price: String(p.price), unit: p.unit, stock_qty: String(p.stock_qty), low_stock_threshold: String(p.low_stock_threshold), image_url: p.image_url || '' })
    setShowForm(true)
  }

  async function handleSave() {
    const payload = { name: form.name, name_gujarati: form.name_gujarati || null, category_id: form.category_id || null, price: parseFloat(form.price) || 0, unit: form.unit, stock_qty: parseFloat(form.stock_qty) || 0, low_stock_threshold: parseFloat(form.low_stock_threshold) || 5, image_url: form.image_url || null }
    if (editing) await supabase.from('products').update(payload).eq('id', editing.id)
    else await supabase.from('products').insert(payload)
    setShowForm(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete?')) return
    await supabase.from('products').delete().eq('id', id)
    load()
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-bold text-slate-500">{products.length} products</p>
        <button onClick={openAdd} className="bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-1.5">
          <Plus size={16} /> Add
        </button>
      </div>

      <div className="space-y-2">
        {products.map((p) => {
          const isLow = p.stock_qty <= p.low_stock_threshold
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-lg">📦</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm truncate">{p.name}</p>
                <p className="text-xs text-slate-400">₹{p.price} / {p.unit}</p>
                <p className={`text-xs font-bold ${isLow ? 'text-red-500' : 'text-slate-400'}`}>
                  Stock: {p.stock_qty} {isLow && '⚠️ Low'}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="text-blue-500 p-1"><Pencil size={16} /></button>
                <button onClick={() => handleDelete(p.id)} className="text-red-400 p-1"><Trash2 size={16} /></button>
              </div>
            </div>
          )
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg">{editing ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <input placeholder="Product Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
            <input placeholder="ગુજરાતી નામ" value={form.name_gujarati} onChange={e => setForm({ ...form, name_gujarati: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
            <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Price ₹ *" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
              <input placeholder="Unit (kg/pcs)" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Stock Qty" type="number" value={form.stock_qty} onChange={e => setForm({ ...form, stock_qty: e.target.value })} className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
              <input placeholder="Low Stock Limit" type="number" value={form.low_stock_threshold} onChange={e => setForm({ ...form, low_stock_threshold: e.target.value })} className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <ImageUploadField label="Product Image" value={form.image_url || null} onChange={url => setForm({ ...form, image_url: url })} />
            <button onClick={handleSave} className="w-full bg-green-700 text-white font-bold py-3 rounded-2xl">Save</button>
          </div>
        </div>
      )}
    </div>
  )
}
