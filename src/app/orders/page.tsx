'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useShopAuth } from '@/lib/shop-auth'
import { Order } from '@/lib/types'

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600',
  processing: 'bg-blue-50 text-blue-600',
  delivered: 'bg-green-50 text-green-600',
  cancelled: 'bg-red-50 text-red-600',
}

export default function MyOrdersPage() {
  const { shop, loading } = useShopAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    if (!loading && !shop) router.push('/login?redirect=/orders')
  }, [loading, shop, router])

  useEffect(() => {
    if (!shop) return
    supabase
      .from('orders')
      .select('*')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders((data as Order[]) || []))
  }, [shop])

  return (
    <div className="px-4 pt-3 pb-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-extrabold text-slate-900">My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center text-center">
          <Package size={28} className="text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">હજુ સુધી કોઈ ઓર્ડર નથી</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-bold text-slate-800 text-sm">{order.order_number}</p>
                <p className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-slate-800">₹{order.total_amount}</p>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusColors[order.status]}`}>
                  {order.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
