'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Save, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { DailyRate } from '@/lib/types'

export default function AdminRatesPage() {
  const [rates, setRates] = useState<DailyRate[]>([])
  const [editedRates, setEditedRates] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({ item_name: '', item_name_gujarati: '', rate: '', unit: 'kg' })

  async function load() {
    const { data } = await supabase.from('daily_rates').select('*').order('sort_order')
    setRates((data as DailyRate[]) || [])
  }

  useEffect(() => {
    load()
  }, [])

  async function saveRate(id: string) {
    const newRate = parseFloat(editedRates[id])
    if (isNaN(newRate)) return
    setSavingId(id)
    await supabase.from('daily_rates').update({ rate: newRate, updated_at: new Date().toISOString() }).eq('id', id)
    setSavingId(null)
    setEditedRates((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    load()
  }

  async function addItem() {
    if (!newItem.item_name.trim()) return
    await supabase.from('daily_rates').insert({
      item_name: newItem.item_name.trim(),
      item_name_gujarati: newItem.item_name_gujarati.trim() || null,
      rate: parseFloat(newItem.rate) || 0,
      unit: newItem.unit,
      sort_order: rates.length,
    })
    setNewItem({ item_name: '', item_name_gujarati: '', rate: '', unit: 'kg' })
    setShowAddForm(false)
    load()
  }

  async function deleteItem(id: string) {
    if (!confirm('આ item delete કરવું છે?')) return
    await supabase.from('daily_rates').delete().eq('id', id)
    load()
  }

  return (
    <div className="p-5 space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">આજનો ભાવ (Today&apos;s Rate)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Item એક વાર ઉમેરો, પછી જ્યારે ભાવ બદલે ત્યારે ફક્ત rate number બદલીને Save કરો
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 flex-shrink-0"
        >
          <Plus size={16} /> Add Item
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        {rates.map((rate) => {
          const editValue = editedRates[rate.id] ?? String(rate.rate)
          const isDirty = editedRates[rate.id] !== undefined && editedRates[rate.id] !== String(rate.rate)
          return (
            <div key={rate.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-slate-800 text-sm">{rate.item_name}</p>
                {rate.item_name_gujarati && <p className="text-xs text-slate-400">{rate.item_name_gujarati}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-slate-400 text-sm">₹</span>
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditedRates((prev) => ({ ...prev, [rate.id]: e.target.value }))}
                  className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold text-center"
                />
                <span className="text-xs text-slate-400">/{rate.unit}</span>
                {isDirty && (
                  <button
                    onClick={() => saveRate(rate.id)}
                    disabled={savingId === rate.id}
                    className="bg-green-600 text-white p-1.5 rounded-lg"
                  >
                    {savingId === rate.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  </button>
                )}
                <button onClick={() => deleteItem(rate.id)} className="text-red-400 p-1">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          )
        })}
        {rates.length === 0 && <p className="p-6 text-center text-sm text-slate-400">હજુ કોઈ item ઉમેર્યું નથી</p>}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg">Add Rate Item</h2>
              <button onClick={() => setShowAddForm(false)}>
                <X size={20} />
              </button>
            </div>
            <input
              placeholder="Item Name (e.g. Tomato)"
              value={newItem.item_name}
              onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            />
            <input
              placeholder="ગુજરાતી નામ (e.g. ટામેટા)"
              value={newItem.item_name_gujarati}
              onChange={(e) => setNewItem({ ...newItem, item_name_gujarati: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Rate (₹)"
                type="number"
                value={newItem.rate}
                onChange={(e) => setNewItem({ ...newItem, rate: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
              />
              <input
                placeholder="Unit (kg/pcs)"
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
              />
            </div>
            <button onClick={addItem} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl">
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
