'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Order } from '@/lib/types'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  processing: 'Accept',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export default function AdminAppOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState('all')

  async function load() {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    setOrders((data as Order[]) || [])
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id: string, status: string) {
    await supabase.from('orders').update({ status }).eq('id', id)
    load()
  }

  const filters = ['all', 'pending', 'processing', 'delivered', 'cancelled']
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  return (
    <div className="p-4 space-y-3">
      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${filter === f ? 'bg-green-800 text-white border-green-800' : 'bg-white text-slate-600 border-slate-200'}`}>
            {f === 'all' ? 'બધા' : statusLabels[f]}
            {f !== 'all' && <span className="ml-1">({orders.filter(o => o.status === f).length})</span>}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-extrabold text-slate-900">{order.shop_name_snapshot}</p>
                <p className="text-xs text-slate-400">{order.order_number} • {new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                <p className="text-xs text-slate-400">{order.payment_method === 'udhar' ? 'ઉધાર' : 'Cash'} • {order.delivery_mode === 'pickup' ? 'Pickup' : 'Delivery'}</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-green-700 text-lg">₹{order.total_amount}</p>
                {order.amount_due > 0 && <p className="text-xs text-red-500 font-bold">Due: ₹{order.amount_due}</p>}
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {['processing', 'pending', 'delivered', 'cancelled'].map(s => (
                <button key={s} onClick={() => updateStatus(order.id, s)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${order.status === s ? statusColors[s] : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                  {statusLabels[s]}
                </button>
              ))}
            </div>

            {order.admin_reply && (
              <p className="text-xs text-blue-600 bg-blue-50 rounded-xl px-3 py-2">Reply: {order.admin_reply}</p>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-sm text-slate-400 py-8">કોઈ order નથી</p>}
      </div>
    </div>
  )
}
