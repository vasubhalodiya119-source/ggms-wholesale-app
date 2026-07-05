'use client'

import { useEffect, useState } from 'react'
import { Send, Check, Megaphone, Package, AlertTriangle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Broadcast } from '@/lib/types'
import { triggerPush } from '@/lib/push'

type LowStockAlert = { id: string; stock_at_alert: number; is_resolved: boolean; created_at: string; products: { name: string } | null }
type CreditAlert = { id: string; balance_at_alert: number; credit_limit_at_alert: number; is_resolved: boolean; created_at: string; shops: { shop_name: string } | null }

export default function AdminAppNotificationsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [lowStock, setLowStock] = useState<LowStockAlert[]>([])
  const [creditAlerts, setCreditAlerts] = useState<CreditAlert[]>([])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  async function load() {
    const { data: bc } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false }).limit(10)
    setBroadcasts((bc as Broadcast[]) || [])
    const { data: ls } = await supabase.from('low_stock_alerts').select('*, products(name)').eq('is_resolved', false).order('created_at', { ascending: false })
    setLowStock((ls as any) || [])
    const { data: ca } = await supabase.from('credit_alerts').select('*, shops(shop_name)').eq('is_resolved', false).order('created_at', { ascending: false })
    setCreditAlerts((ca as any) || [])
  }

  useEffect(() => { load() }, [])

  async function sendBroadcast() {
    if (!message.trim()) return
    setSending(true)
    await supabase.from('broadcasts').insert({ message: message.trim() })
    await triggerPush({ title: 'GGM&S Wholesale', body: message.trim(), url: '/notifications' })
    setMessage('')
    setSending(false)
    load()
  }

  return (
    <div className="p-4 space-y-4">
      {/* Broadcast */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <p className="font-bold text-slate-800 flex items-center gap-2 text-sm">
          <Megaphone size={16} className="text-purple-500" /> Broadcast Notification
        </p>
        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
          placeholder="Message type karo - badha shopkeepers ne notification jashe..."
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none" />
        <button onClick={sendBroadcast} disabled={sending || !message.trim()}
          className="w-full bg-purple-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Send to All
        </button>
      </div>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div>
          <p className="text-sm font-bold text-slate-600 mb-2 flex items-center gap-1.5">
            <Package size={14} className="text-red-500" /> Low Stock ({lowStock.length})
          </p>
          <div className="space-y-2">
            {lowStock.map(alert => (
              <div key={alert.id} className="bg-red-50 border border-red-100 rounded-2xl p-3 flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm text-slate-800">{alert.products?.name}</p>
                  <p className="text-xs text-red-600">Stock: {alert.stock_at_alert}</p>
                </div>
                <button onClick={async () => { await supabase.from('low_stock_alerts').update({ is_resolved: true }).eq('id', alert.id); load() }}
                  className="text-green-600 bg-green-50 p-2 rounded-full">
                  <Check size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Credit alerts */}
      {creditAlerts.length > 0 && (
        <div>
          <p className="text-sm font-bold text-slate-600 mb-2 flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-amber-500" /> Credit Alerts ({creditAlerts.length})
          </p>
          <div className="space-y-2">
            {creditAlerts.map(alert => (
              <div key={alert.id} className="bg-amber-50 border border-amber-100 rounded-2xl p-3 flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm text-slate-800">{alert.shops?.shop_name}</p>
                  <p className="text-xs text-amber-700">₹{alert.balance_at_alert} / ₹{alert.credit_limit_at_alert}</p>
                </div>
                <button onClick={async () => { await supabase.from('credit_alerts').update({ is_resolved: true }).eq('id', alert.id); load() }}
                  className="text-green-600 bg-green-50 p-2 rounded-full">
                  <Check size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Broadcast history */}
      {broadcasts.length > 0 && (
        <div>
          <p className="text-sm font-bold text-slate-600 mb-2">Sent Notifications</p>
          <div className="space-y-2">
            {broadcasts.map(b => (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-200 p-3">
                <p className="text-sm text-slate-700">{b.message}</p>
                <p className="text-[11px] text-slate-400 mt-1">{new Date(b.created_at).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
