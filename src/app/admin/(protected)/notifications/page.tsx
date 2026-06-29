'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, AlertTriangle, Check, Send, Megaphone, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Broadcast } from '@/lib/types'

type LowStockAlert = {
  id: string
  product_id: string
  stock_at_alert: number
  is_resolved: boolean
  created_at: string
  products: { name: string } | null
}

type CreditAlert = {
  id: string
  shop_id: string
  balance_at_alert: number
  credit_limit_at_alert: number
  is_resolved: boolean
  created_at: string
  shops: { shop_name: string } | null
}

export default function NotificationCenterPage() {
  const [lowStock, setLowStock] = useState<LowStockAlert[]>([])
  const [creditAlerts, setCreditAlerts] = useState<CreditAlert[]>([])
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  async function load() {
    const { data: ls } = await supabase
      .from('low_stock_alerts')
      .select('*, products(name)')
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
    setLowStock((ls as any) || [])

    const { data: ca } = await supabase
      .from('credit_alerts')
      .select('*, shops(shop_name)')
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
    setCreditAlerts((ca as any) || [])

    const { data: bc } = await supabase
      .from('broadcasts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    setBroadcasts((bc as Broadcast[]) || [])
  }

  useEffect(() => {
    load()
  }, [])

  async function sendBroadcast() {
    if (!message.trim()) return
    setSending(true)
    await supabase.from('broadcasts').insert({ message: message.trim() })
    setMessage('')
    setSending(false)
    load()
  }

  async function deleteBroadcast(id: string) {
    await supabase.from('broadcasts').delete().eq('id', id)
    load()
  }

  async function resolveLowStock(id: string) {
    await supabase.from('low_stock_alerts').update({ is_resolved: true }).eq('id', id)
    load()
  }

  async function resolveCreditAlert(id: string) {
    await supabase.from('credit_alerts').update({ is_resolved: true }).eq('id', id)
    load()
  }

  return (
    <div className="p-5 space-y-5 max-w-2xl">
      <h1 className="text-xl font-extrabold text-slate-900">Notification Center</h1>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <h2 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
          <Megaphone size={16} className="text-purple-500" /> બધા દુકાનદારોને નોટિફિકેશન મોકલો
        </h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="જે લખશો એ બધા shopkeeper ને દેખાશે... દા.ત. 'આવતીકાલે રજા છે' ya 'નવો સ્ટોક આવી ગયો છે'"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
        />
        <button
          onClick={sendBroadcast}
          disabled={sending || !message.trim()}
          className="bg-purple-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50"
        >
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          મોકલો
        </button>

        {broadcasts.length > 0 && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase">મોકલેલા Notifications</p>
            {broadcasts.map((b) => (
              <div key={b.id} className="flex items-start justify-between gap-2 bg-slate-50 rounded-xl p-3">
                <div>
                  <p className="text-sm text-slate-700">{b.message}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{new Date(b.created_at).toLocaleString('en-IN')}</p>
                </div>
                <button onClick={() => deleteBroadcast(b.id)} className="text-red-400 text-xs font-bold flex-shrink-0">
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-bold text-slate-700 mb-2 flex items-center gap-2 text-sm">
          <Package size={16} className="text-red-500" /> Low Stock Alerts ({lowStock.length})
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {lowStock.map((alert) => (
            <div key={alert.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800 text-sm">{alert.products?.name || 'Unknown'}</p>
                <p className="text-xs text-red-500">Stock left: {alert.stock_at_alert}</p>
                <p className="text-[11px] text-slate-400">{new Date(alert.created_at).toLocaleString('en-IN')}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/admin/inventory" className="text-xs font-bold text-blue-500 underline">
                  Restock
                </Link>
                <button onClick={() => resolveLowStock(alert.id)} className="text-green-600 bg-green-50 p-1.5 rounded-full">
                  <Check size={14} />
                </button>
              </div>
            </div>
          ))}
          {lowStock.length === 0 && <p className="p-4 text-sm text-slate-400 text-center">કોઈ low stock alert નથી</p>}
        </div>
      </div>

      <div>
        <h2 className="font-bold text-slate-700 mb-2 flex items-center gap-2 text-sm">
          <AlertTriangle size={16} className="text-amber-500" /> Credit Limit Alerts ({creditAlerts.length})
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {creditAlerts.map((alert) => (
            <div key={alert.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800 text-sm">{alert.shops?.shop_name || 'Unknown'}</p>
                <p className="text-xs text-amber-600">
                  Balance ₹{alert.balance_at_alert} / Limit ₹{alert.credit_limit_at_alert}
                </p>
                <p className="text-[11px] text-slate-400">{new Date(alert.created_at).toLocaleString('en-IN')}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/admin/shops/${alert.shop_id}`} className="text-xs font-bold text-blue-500 underline">
                  View
                </Link>
                <button onClick={() => resolveCreditAlert(alert.id)} className="text-green-600 bg-green-50 p-1.5 rounded-full">
                  <Check size={14} />
                </button>
              </div>
            </div>
          ))}
          {creditAlerts.length === 0 && <p className="p-4 text-sm text-slate-400 text-center">કોઈ credit alert નથી</p>}
        </div>
      </div>
    </div>
  )
}
