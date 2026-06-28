'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, AlertTriangle, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
  }

  useEffect(() => {
    load()
  }, [])

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
