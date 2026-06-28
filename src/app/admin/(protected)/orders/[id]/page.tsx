'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Order, OrderItem, OrderStatus } from '@/lib/types'

const statusOptions: OrderStatus[] = ['pending', 'processing', 'delivered', 'cancelled']

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [paidInput, setPaidInput] = useState('')

  async function load() {
    const { data: o } = await supabase.from('orders').select('*').eq('id', orderId).single()
    setOrder(o as Order)
    setPaidInput(String((o as Order)?.amount_paid || 0))
    const { data: i } = await supabase.from('order_items').select('*').eq('order_id', orderId)
    setItems((i as OrderItem[]) || [])
  }

  useEffect(() => {
    load()
  }, [orderId])

  async function updateStatus(status: OrderStatus) {
    await supabase.from('orders').update({ status }).eq('id', orderId)
    load()
  }

  async function recordPayment() {
    if (!order) return
    const newPaid = parseFloat(paidInput) || 0
    const diff = newPaid - order.amount_paid

    await supabase.from('orders').update({ amount_paid: newPaid }).eq('id', orderId)

    if (diff !== 0 && order.shop_id) {
      // payment received reduces shop balance
      const { data: shop } = await supabase.from('shops').select('current_balance').eq('id', order.shop_id).single()
      if (shop) {
        await supabase
          .from('shops')
          .update({ current_balance: Number(shop.current_balance) - diff })
          .eq('id', order.shop_id)
      }
      await supabase.from('payment_ledger').insert({
        shop_id: order.shop_id,
        order_id: order.id,
        type: 'payment_received',
        amount: -diff,
        note: `Payment for ${order.order_number}`,
      })
    }
    load()
  }

  if (!order) return <div className="p-6 text-sm text-slate-400">Loading...</div>

  return (
    <div className="p-5 max-w-2xl space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 text-sm font-bold">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">{order.order_number}</h1>
            <p className="text-sm text-slate-500">{order.shop_name_snapshot} • {order.shop_phone_snapshot}</p>
          </div>
          <select
            value={order.status}
            onChange={(e) => updateStatus(e.target.value as OrderStatus)}
            className="text-xs font-bold uppercase px-3 py-2 rounded-xl border border-slate-200"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-slate-400">{new Date(order.created_at).toLocaleString('en-IN')}</p>
        <p className="text-sm">
          <span className="text-slate-500">Payment Method: </span>
          <span className="font-bold text-slate-800 uppercase">{order.payment_method}</span>
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.id} className="p-3 flex justify-between text-sm">
            <div>
              <p className="font-bold text-slate-800">{item.product_name_snapshot}</p>
              <p className="text-slate-400 text-xs">{item.qty} x ₹{item.price}</p>
            </div>
            <p className="font-bold text-slate-800">₹{item.line_total.toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Total Amount</span>
          <span className="font-extrabold text-slate-900">₹{order.total_amount.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-500">Amount Paid</span>
          <div className="flex gap-2">
            <input
              type="number"
              value={paidInput}
              onChange={(e) => setPaidInput(e.target.value)}
              className="w-28 border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
            />
            <button onClick={recordPayment} className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
              Update
            </button>
          </div>
        </div>
        <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
          <span className="font-bold text-red-600">Amount Due</span>
          <span className="font-extrabold text-red-600">₹{order.amount_due.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
