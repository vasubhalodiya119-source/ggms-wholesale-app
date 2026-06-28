'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Order, OrderStatus } from '@/lib/types'

const statusOptions: OrderStatus[] = ['pending', 'processing', 'delivered', 'cancelled']

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600 border-amber-200',
  processing: 'bg-blue-50 text-blue-600 border-blue-200',
  delivered: 'bg-green-50 text-green-600 border-green-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<string>('all')

  async function load() {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    setOrders((data as Order[]) || [])
  }

  useEffect(() => {
    load()
  }, [])

  async function updateStatus(orderId: string, status: OrderStatus) {
    await supabase.from('orders').update({ status }).eq('id', orderId)
    load()
  }

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  return (
    <div className="p-5 space-y-4">
      <h1 className="text-xl font-extrabold text-slate-900">Orders ({orders.length})</h1>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {['all', ...statusOptions].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${
              filter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        {filtered.map((order) => (
          <div key={order.id} className="p-4 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <Link href={`/admin/orders/${order.id}`} className="font-bold text-slate-800 text-sm hover:underline">
                {order.order_number}
              </Link>
              <p className="text-xs text-slate-400">
                {order.shop_name_snapshot} • {order.shop_phone_snapshot}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{new Date(order.created_at).toLocaleString('en-IN')}</p>
            </div>
            <div className="text-right">
              <p className="font-extrabold text-slate-800">₹{order.total_amount}</p>
              {order.amount_due > 0 && <p className="text-[11px] text-red-500 font-semibold">Due ₹{order.amount_due}</p>}
            </div>
            <select
              value={order.status}
              onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
              className={`text-xs font-bold uppercase px-2 py-1.5 rounded-lg border ${statusColors[order.status]}`}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        ))}
        {filtered.length === 0 && <p className="p-6 text-center text-sm text-slate-400">કોઈ ઓર્ડર નથી</p>}
      </div>
    </div>
  )
}
