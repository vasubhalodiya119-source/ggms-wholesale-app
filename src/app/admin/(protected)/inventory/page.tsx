'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Product, Category } from '@/lib/types'
import ImageUploadField from '@/components/ImageUploadField'

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({
    name: '',
    name_gujarati: '',
    category_id: '',
    price: '',
    unit: 'pcs',
    stock_qty: '',
    low_stock_threshold: '5',
    image_url: '',
  })

  async function load() {
    const { data: prods } = await supabase.from('products').select('*').order('name')
    setProducts((prods as Product[]) || [])
    const { data: cats } = await supabase.from('categories').select('*').order('sort_order')
    setCategories((cats as Category[]) || [])
  }

  useEffect(() => {
    load()
  }, [])

  function openNew() {
    setEditing(null)
    setForm({ name: '', name_gujarati: '', category_id: '', price: '', unit: 'pcs', stock_qty: '', low_stock_threshold: '5', image_url: '' })
    setShowForm(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({
      name: p.name,
      name_gujarati: p.name_gujarati || '',
      category_id: p.category_id || '',
      price: String(p.price),
      unit: p.unit,
      stock_qty: String(p.stock_qty),
      low_stock_threshold: String(p.low_stock_threshold),
      image_url: p.image_url || '',
    })
    setShowForm(true)
  }

  async function handleSave() {
    const payload = {
      name: form.name,
      name_gujarati: form.name_gujarati || null,
      category_id: form.category_id || null,
      price: parseFloat(form.price) || 0,
      unit: form.unit,
      stock_qty: parseFloat(form.stock_qty) || 0,
      low_stock_threshold: parseFloat(form.low_stock_threshold) || 5,
      image_url: form.image_url || null,
    }

    if (editing) {
      await supabase.from('products').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('products').insert(payload)
    }
    setShowForm(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('ડિલીટ કરવું છે?')) return
    await supabase.from('products').delete().eq('id', id)
    load()
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-900">Inventory ({products.length})</h1>
        <button
          onClick={openNew}
          className="bg-green-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-bold text-slate-400 border-b border-slate-100">
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Low Stock At</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const category = categories.find((c) => c.id === p.category_id)
              const isLow = p.stock_qty <= p.low_stock_threshold
              return (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="p-3 font-semibold text-slate-800">{p.name}</td>
                  <td className="p-3 text-slate-500">{category?.name || '-'}</td>
                  <td className="p-3 font-bold text-slate-800">₹{p.price}</td>
                  <td className="p-3">
                    <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${isLow ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {p.stock_qty} {p.unit}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{p.low_stock_threshold}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => openEdit(p)} className="text-blue-500">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {products.length === 0 && <p className="p-6 text-center text-sm text-slate-400">કોઈ પ્રોડક્ટ નથી</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <input
              placeholder="Product Name"
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
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Price"
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
              />
              <input
                placeholder="Unit (kg/pcs)"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Stock Qty"
                type="number"
                value={form.stock_qty}
                onChange={(e) => setForm({ ...form, stock_qty: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
              />
              <input
                placeholder="Low Stock Alert At"
                type="number"
                value={form.low_stock_threshold}
                onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
              />
            </div>
            <ImageUploadField
              label="Product Image"
              value={form.image_url || null}
              onChange={(url) => setForm({ ...form, image_url: url })}
            />
            <button onClick={handleSave} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl mt-2">
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
