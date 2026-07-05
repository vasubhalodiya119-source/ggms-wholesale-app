'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Clock, X, ShoppingBag, Send, TrendingUp, Package, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Order, OrderItem } from '@/lib/types'
import { triggerPush } from '@/lib/push'
import { buildWhatsAppUrl } from '@/lib/receipt'

type NewOrderAlert = { order: Order; items: OrderItem[] }

function DashboardContent() {
  const searchParams = useSearchParams()
  const newOrderId = searchParams.get('new_order')

  const [totalSales, setTotalSales] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [pendingOrders, setPendingOrders] = useState(0)
  const [liveItems, setLiveItems] = useState(0)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [lowStockCount, setLowStockCount] = useState(0)
  const [newOrderAlert, setNewOrderAlert] = useState<NewOrderAlert | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [replyText, setReplyText] = useState('')

  const load = useCallback(async () => {
    const { data: orders } = await supabase.from('orders').select('*')
    if (orders) {
      setTotalSales(orders.reduce((s, o) => s + Number(o.total_amount), 0))
      setTotalOrders(orders.length)
      setPendingOrders(orders.filter((o) => o.status === 'pending').length)
      setRecentOrders((orders as Order[]).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10))
    }
    const { data: products } = await supabase.from('products').select('id')
    setLiveItems(products?.length || 0)
    const { count: lsCount } = await supabase.from('low_stock_alerts').select('*', { count: 'exact', head: true }).eq('is_resolved', false)
    setLowStockCount(lsCount || 0)
  }, [])

  useEffect(() => {
    load()
    const channel = supabase.channel('admin-app-new-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, async (payload) => {
        const order = payload.new as Order
        const { data: items } = await supabase.from('order_items').select('*').eq('order_id', order.id)
        setNewOrderAlert({ order, items: (items as OrderItem[]) || [] })
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('નવો ઓર્ડર! 🛍️', { body: `${order.shop_name_snapshot} - ₹${order.total_amount}` })
        }
        load()
      })
      .subscribe()
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    return () => { supabase.removeChannel(channel) }
  }, [load])

  useEffect(() => {
    if (!newOrderId) return
    async function loadFromUrl() {
      const { data: order } = await supabase.from('orders').select('*').eq('id', newOrderId).single()
      if (!order) return
      const { data: items } = await supabase.from('order_items').select('*').eq('order_id', newOrderId)
      setNewOrderAlert({ order: order as Order, items: (items as OrderItem[]) || [] })
    }
    loadFromUrl()
  }, [newOrderId])

  async function handleAction(status: 'processing' | 'pending' | 'cancelled') {
    if (!newOrderAlert) return
    setActionLoading(true)
    await supabase.from('orders').update({ status }).eq('id', newOrderAlert.order.id)
    const labels: Record<string, string> = {
      processing: '✅ Accept - તમારો ઓર્ડર accept થઈ ગયો!',
      pending: '⏳ Pending - ઓર્ડર pending છે',
      cancelled: '❌ Decline - ઓર્ડર decline થયો',
    }
    await triggerPush({ title: 'GGM&S Wholesale - ઓર્ડર Update 📦', body: labels[status], url: `/orders/${newOrderAlert.order.id}`, shop_id: newOrderAlert.order.shop_id || undefined })
    setActionLoading(false)
    setNewOrderAlert(null)
    setReplyText('')
    load()
  }

  async function sendReply() {
    if (!newOrderAlert || !replyText.trim()) return
    setActionLoading(true)
    await supabase.from('orders').update({ admin_reply: replyText.trim(), admin_reply_at: new Date().toISOString() }).eq('id', newOrderAlert.order.id)
    await triggerPush({ title: 'GGM&S - ઓર્ડર Reply 📩', body: replyText.trim(), url: `/orders/${newOrderAlert.order.id}`, shop_id: newOrderAlert.order.shop_id || undefined })
    setActionLoading(false)
    setNewOrderAlert(null)
    setReplyText('')
    load()
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700',
    processing: 'bg-blue-50 text-blue-700',
    delivered: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-700',
  }

  return (
    <div className="p-4 space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200">
          <p className="text-xs text-slate-400 font-bold uppercase">Total Sales</p>
          <p className="text-xl font-extrabold text-green-700 mt-1">₹{totalSales.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200">
          <p className="text-xs text-slate-400 font-bold uppercase">Orders</p>
          <p className="text-xl font-extrabold text-slate-800 mt-1">{totalOrders}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
          <p className="text-xs text-amber-600 font-bold uppercase">Pending</p>
          <p className="text-xl font-extrabold text-amber-700 mt-1">{pendingOrders}</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <p className="text-xs text-blue-600 font-bold uppercase">Products</p>
          <p className="text-xl font-extrabold text-blue-700 mt-1">{liveItems}</p>
        </div>
      </div>

      {lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500" />
          <p className="text-sm text-red-700 font-bold">{lowStockCount} product(s) low stock!</p>
        </div>
      )}

      {/* Recent orders */}
      <div>
        <p className="text-sm font-extrabold text-slate-700 mb-2">Recent Orders</p>
        <div className="space-y-2">
          {recentOrders.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800 text-sm">{o.shop_name_snapshot}</p>
                <p className="text-xs text-slate-400">{o.order_number} • ₹{o.total_amount}</p>
              </div>
              <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${statusColors[o.status] || 'bg-slate-100 text-slate-600'}`}>
                {o.status}
              </span>
            </div>
          ))}
          {recentOrders.length === 0 && <p className="text-sm text-slate-400 text-center py-4">કોઈ order નથી</p>}
        </div>
      </div>

      {/* New Order Popup */}
      {newOrderAlert && (
        <div className="fixed inset-0 bg-black/60 flex items-end z-50 p-0">
          <div className="bg-white w-full rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="bg-green-700 text-white px-5 py-4 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} />
                <p className="font-extrabold text-lg">નવો ઓર્ડર!</p>
              </div>
              <button onClick={() => setNewOrderAlert(null)}><X size={22} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="font-extrabold text-slate-900 text-lg">{newOrderAlert.order.shop_name_snapshot}</p>
                <p className="text-sm text-slate-400">{newOrderAlert.order.order_number} • {newOrderAlert.order.shop_phone_snapshot}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {newOrderAlert.order.payment_method === 'udhar' ? 'ઉધાર' : 'Cash'} •
                  {newOrderAlert.order.delivery_mode === 'pickup' ? ' Pick Up' : ' Shop Delivery'}
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 space-y-2">
                {newOrderAlert.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-700">{item.product_name_snapshot} × {item.qty}</span>
                    <span className="font-bold">₹{item.line_total}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="font-extrabold text-slate-900">TOTAL</span>
                  <span className="font-extrabold text-green-700 text-lg">₹{newOrderAlert.order.total_amount}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => handleAction('processing')} disabled={actionLoading}
                  className="bg-green-50 text-green-700 font-bold py-3 rounded-2xl flex flex-col items-center gap-1 text-xs disabled:opacity-50">
                  <CheckCircle2 size={22} /> Accept
                </button>
                <button onClick={() => handleAction('pending')} disabled={actionLoading}
                  className="bg-amber-50 text-amber-700 font-bold py-3 rounded-2xl flex flex-col items-center gap-1 text-xs disabled:opacity-50">
                  <Clock size={22} /> Pending
                </button>
                <button onClick={() => handleAction('cancelled')} disabled={actionLoading}
                  className="bg-red-50 text-red-700 font-bold py-3 rounded-2xl flex flex-col items-center gap-1 text-xs disabled:opacity-50">
                  <XCircle size={22} /> Decline
                </button>
              </div>

              {/* Reply */}
              <div className="flex gap-2">
                <input value={replyText} onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Reply moklavo shopkeeper ne..."
                  className="flex-1 border border-slate-200 rounded-2xl px-3 py-2.5 text-sm" />
                <button onClick={sendReply} disabled={actionLoading || !replyText.trim()}
                  className="bg-green-700 text-white px-4 rounded-2xl disabled:opacity-40">
                  <Send size={16} />
                </button>
              </div>

              <a href={buildWhatsAppUrl(newOrderAlert.order, newOrderAlert.items, null)} target="_blank"
                className="w-full bg-green-50 text-green-700 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-sm">
                WhatsApp par reply karo
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminAppDashboard() {
  return <Suspense fallback={null}><DashboardContent /></Suspense>
}
