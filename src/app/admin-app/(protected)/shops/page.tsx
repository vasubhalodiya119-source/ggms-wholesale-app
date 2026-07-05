'use client'

import { useEffect, useState } from 'react'
import { Search, Pencil, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Shop } from '@/lib/types'

export default function AdminAppShopsPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Shop | null>(null)
  const [creditLimit, setCreditLimit] = useState('')
  const [balance, setBalance] = useState('')

  async function load() {
    const { data } = await supabase.from('shops').select('*').order('shop_name')
    setShops((data as Shop[]) || [])
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!editing) return
    const newLimit = parseFloat(creditLimit) || 0
    const newBalance = parseFloat(balance) || 0
    await supabase.from('shops').update({ credit_limit: newLimit, current_balance: newBalance }).eq('id', editing.id)
    const diff = newBalance - editing.current_balance
    if (diff !== 0) {
      await supabase.from('payment_ledger').insert({ shop_id: editing.id, type: 'adjustment', amount: diff, note: 'Admin adjustment' })
    }
    setEditing(null)
    load()
  }

  async function toggleActive(shop: Shop) {
    await supabase.from('shops').update({ is_active: !shop.is_active }).eq('id', shop.id)
    load()
  }

  const filtered = shops.filter(s => s.shop_name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search))

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-2.5">
        <Search size={16} className="text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Shop name or phone..." className="flex-1 outline-none text-sm" />
      </div>

      <div className="space-y-2">
        {filtered.map((shop) => {
          const overLimit = shop.credit_limit > 0 && shop.current_balance > shop.credit_limit
          return (
            <div key={shop.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-extrabold text-slate-900">{shop.shop_name}</p>
                  <p className="text-xs text-slate-400">{shop.owner_name} • {shop.phone}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <button onClick={() => toggleActive(shop)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${shop.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {shop.is_active ? 'Active' : 'Blocked'}
                  </button>
                  <button onClick={() => { setEditing(shop); setCreditLimit(String(shop.credit_limit)); setBalance(String(shop.current_balance)) }} className="text-blue-500">
                    <Pencil size={16} />
                  </button>
                </div>
              </div>
              <div className="flex gap-3 text-sm">
                <div className="flex-1 bg-slate-50 rounded-xl p-2.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Udhar Balance</p>
                  <p className={`font-extrabold ${overLimit ? 'text-red-600' : 'text-slate-800'}`}>₹{shop.current_balance}</p>
                </div>
                <div className="flex-1 bg-slate-50 rounded-xl p-2.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Credit Limit</p>
                  <p className="font-extrabold text-slate-800">₹{shop.credit_limit || '∞'}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg">{editing.shop_name}</h2>
              <button onClick={() => setEditing(null)}><X size={20} /></button>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Credit Limit (₹)</label>
              <input type="number" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Current Balance (₹)</label>
              <input type="number" value={balance} onChange={e => setBalance(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mt-1" />
            </div>
            <button onClick={handleSave} className="w-full bg-green-700 text-white font-bold py-3 rounded-2xl">Save</button>
          </div>
        </div>
      )}
    </div>
  )
}
