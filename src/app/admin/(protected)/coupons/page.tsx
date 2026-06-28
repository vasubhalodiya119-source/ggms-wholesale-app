'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Coupon = {
  id: string
  code: string
  discount_type: 'percent' | 'flat'
  discount_value: number
  min_order_amount: number
  is_active: boolean
  expires_at: string | null
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', discount_type: 'percent' as 'percent' | 'flat', discount_value: '', min_order_amount: '0' })

  async function load() {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    setCoupons((data as Coupon[]) || [])
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSave() {
    await supabase.from('coupons').insert({
      code: form.code.toUpperCase(),
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value) || 0,
      min_order_amount: parseFloat(form.min_order_amount) || 0,
    })
    setShowForm(false)
    setForm({ code: '', discount_type: 'percent', discount_value: '', min_order_amount: '0' })
    load()
  }

  async function toggleActive(c: Coupon) {
    await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id)
    load()
  }

  async function handleDelete(id: string) {
    await supabase.from('coupons').delete().eq('id', id)
    load()
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-900">Coupons &amp; Offers ({coupons.length})</h1>
        <button onClick={() => setShowForm(true)} className="bg-green-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5">
          <Plus size={16} /> Add Coupon
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        {coupons.map((c) => (
          <div key={c.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">{c.code}</p>
              <p className="text-xs text-slate-400">
                {c.discount_type === 'percent' ? `${c.discount_value}% off` : `₹${c.discount_value} off`}
                {c.min_order_amount > 0 && ` • Min ₹${c.min_order_amount}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleActive(c)}
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.is_active ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}
              >
                {c.is_active ? 'Active' : 'Inactive'}
              </button>
              <button onClick={() => handleDelete(c.id)} className="text-red-500">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {coupons.length === 0 && <p className="p-6 text-center text-sm text-slate-400">કોઈ coupon નથી</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg">Add Coupon</h2>
              <button onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <input
              placeholder="Coupon Code (e.g. FIRSTORDER)"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            />
            <select
              value={form.discount_type}
              onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'percent' | 'flat' })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            >
              <option value="percent">Percent (%)</option>
              <option value="flat">Flat (₹)</option>
            </select>
            <input
              placeholder="Discount Value"
              type="number"
              value={form.discount_value}
              onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            />
            <input
              placeholder="Min Order Amount"
              type="number"
              value={form.min_order_amount}
              onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
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
