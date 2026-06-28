'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Pencil, X, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Shop } from '@/lib/types'

export default function AdminShopsPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Shop | null>(null)
  const [creditLimitInput, setCreditLimitInput] = useState('')
  const [balanceAdjustInput, setBalanceAdjustInput] = useState('')

  async function load() {
    const { data } = await supabase.from('shops').select('*').order('shop_name')
    setShops((data as Shop[]) || [])
  }

  useEffect(() => {
    load()
  }, [])

  function openEdit(shop: Shop) {
    setEditing(shop)
    setCreditLimitInput(String(shop.credit_limit))
    setBalanceAdjustInput(String(shop.current_balance))
  }

  async function handleSave() {
    if (!editing) return
    const newLimit = parseFloat(creditLimitInput) || 0
    const newBalance = parseFloat(balanceAdjustInput) || 0

    await supabase
      .from('shops')
      .update({ credit_limit: newLimit, current_balance: newBalance })
      .eq('id', editing.id)

    // log adjustment if balance changed manually
    const diff = newBalance - editing.current_balance
    if (diff !== 0) {
      await supabase.from('payment_ledger').insert({
        shop_id: editing.id,
        type: 'adjustment',
        amount: diff,
        note: 'Admin manual adjustment',
      })
    }

    setEditing(null)
    load()
  }

  async function toggleActive(shop: Shop) {
    await supabase.from('shops').update({ is_active: !shop.is_active }).eq('id', shop.id)
    load()
  }

  const filtered = shops.filter(
    (s) =>
      s.shop_name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search)
  )

  return (
    <div className="p-5 space-y-4">
      <h1 className="text-xl font-extrabold text-slate-900">Shops &amp; Credit ({shops.length})</h1>

      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 max-w-sm">
        <Search size={16} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="નામ અથવા ફોન શોધો"
          className="flex-1 outline-none text-sm"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-bold text-slate-400 border-b border-slate-100">
              <th className="p-3">Shop Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Credit Limit</th>
              <th className="p-3">Current Balance (Udhar)</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((shop) => {
              const overLimit = shop.credit_limit > 0 && shop.current_balance > shop.credit_limit
              return (
                <tr key={shop.id} className="border-b border-slate-50">
                  <td className="p-3 font-semibold text-slate-800">{shop.shop_name}</td>
                  <td className="p-3 text-slate-500">{shop.phone}</td>
                  <td className="p-3 text-slate-700">₹{shop.credit_limit}</td>
                  <td className="p-3">
                    <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${overLimit ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                      ₹{shop.current_balance}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleActive(shop)}
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${shop.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
                    >
                      {shop.is_active ? 'Active' : 'Blocked'}
                    </button>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => openEdit(shop)} className="text-blue-500">
                      <Pencil size={15} />
                    </button>
                    <Link href={`/admin/shops/${shop.id}`} className="text-green-600 text-xs font-bold underline">
                      Ledger
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-6 text-center text-sm text-slate-400">કોઈ દુકાન મળી નથી</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg">{editing.shop_name}</h2>
              <button onClick={() => setEditing(null)}>
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-slate-400">{editing.phone}</p>

            <div>
              <label className="text-xs font-bold text-slate-500">ઉધાર લિમિટ (Credit Limit)</label>
              <input
                type="number"
                value={creditLimitInput}
                onChange={(e) => setCreditLimitInput(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mt-1"
                placeholder="0 = no limit"
              />
              <p className="text-[11px] text-slate-400 mt-1">0 રાખવાથી કોઈ લિમિટ નહીં હોય</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500">હાલની બાકી રકમ (Current Balance)</label>
              <input
                type="number"
                value={balanceAdjustInput}
                onChange={(e) => setBalanceAdjustInput(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mt-1"
              />
            </div>

            <button onClick={handleSave} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl mt-2">
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
