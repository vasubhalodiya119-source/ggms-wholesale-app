'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, Banknote, QrCode, BookUser } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Order, OrderItem } from '@/lib/types'

const paymentLabels: Record<string, { label: string; icon: typeof Banknote }> = {
  cash: { label: 'Cash / રોકડ', icon: Banknote },
  qr: { label: 'QR / UPI', icon: QrCode },
  udhar: { label: 'ઉધાર', icon: BookUser },
}

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])

  useEffect(() => {
    supabase.from('orders').select('*').eq('id', orderId).single().then(({ data }) => {
      setOrder(data as Order)
    })
    supabase.from('order_items').select('*').eq('order_id', orderId).then(({ data }) => {
      setItems((data as OrderItem[]) || [])
    })
  }, [orderId])

  if (!order) return <div className="p-6 text-center text-sm text-slate-400">Loading...</div>

  const PayIcon = paymentLabels[order.payment_method]?.icon || Banknote

  return (
    <div className="px-4 pt-6 pb-8 max-w-md mx-auto space-y-4">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-3">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h1 className="text-lg font-extrabold text-slate-900">ઓર્ડર સફળતાપૂર્વક થયો!</h1>
        <p className="text-sm text-slate-400 mt-1">{order.order_number}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">દુકાનનું નામ</span>
          <span className="font-bold text-slate-800">{order.shop_name_snapshot}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">ફોન નંબર</span>
          <span className="font-bold text-slate-800">{order.shop_phone_snapshot}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">સ્ટેટસ</span>
          <span className="font-bold text-amber-600 uppercase text-xs bg-amber-50 px-2 py-0.5 rounded-full">
            {order.status}
          </span>
        </div>
        <div className="flex justify-between text-sm items-center">
          <span className="text-slate-500">પેમેન્ટ પદ્ધતિ</span>
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <PayIcon size={14} /> {paymentLabels[order.payment_method]?.label}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.id} className="p-3 flex justify-between text-sm">
            <div>
              <p className="font-bold text-slate-800">{item.product_name_snapshot}</p>
              <p className="text-slate-400 text-xs">
                {item.qty} x ₹{item.price}
              </p>
            </div>
            <p className="font-bold text-slate-800">₹{item.line_total.toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Subtotal</span>
          <span className="font-bold text-slate-800">₹{order.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base pt-2 border-t border-slate-100">
          <span className="font-bold text-slate-900">Total Amount</span>
          <span className="font-extrabold text-slate-900">₹{order.total_amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">ચૂકવેલ રકમ</span>
          <span className="font-bold text-green-600">₹{order.amount_paid.toFixed(2)}</span>
        </div>
        {order.amount_due > 0 && (
          <div className="flex justify-between text-base pt-2 border-t border-slate-100">
            <span className="font-bold text-red-600">બાકી રકમ (Due)</span>
            <span className="font-extrabold text-red-600">₹{order.amount_due.toFixed(2)}</span>
          </div>
        )}
      </div>

      <a
        href={`https://wa.me/91${order.shop_phone_snapshot}?text=${encodeURIComponent(
          `તમારો ઓર્ડર ${order.order_number} કન્ફર્મ થયો છે. Total: ₹${order.total_amount}`
        )}`}
        target="_blank"
        className="block w-full text-center bg-green-600 text-white font-bold py-3 rounded-2xl"
      >
        WhatsApp પર બિલ મોકલો
      </a>
    </div>
  )
}
