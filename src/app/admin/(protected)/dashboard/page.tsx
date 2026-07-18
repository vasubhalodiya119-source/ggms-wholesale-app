'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Clock, X, ShoppingBag, MessageCircle, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Order, OrderItem } from '@/lib/types'
import { buildWhatsAppUrl } from '@/lib/receipt'
import { triggerPush } from '@/lib/push'

type CategoryStock = { name: string; count: number }
type NewOrderAlert = { order: Order; items: OrderItem[] }

export default function AdminDashboard() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const newOrderId = searchParams.get('new_order')

  const [totalSales, setTotalSales] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [pendingOrders, setPendingOrders] = useState(0)
  const [liveItems, setLiveItems] = useState(0)
  const [stockBreakdown, setStockBreakdown] = useState<CategoryStock[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [lowStockCount, setLowStockCount] = useState(0)
  const [creditAlertCount, setCreditAlertCount] = useState(0)
  const [newOrderAlert, setNewOrderAlert] = useState<NewOrderAlert | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [replyText, setReplyText] = useState('')

  const load = useCallback(async () => {
    const { data: orders } = await supabase.from('orders').select('*')
    if (orders) {
      setTotalSales(orders.reduce((s, o) => s + Number(o.total_amount), 0))
      setTotalOrders(orders.length)
      setPendingOrders(orders.filter((o) => o.status === 'pending').length)
      setRecentOrders(
        (orders as Order[]).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5)
      )
    }

    const { data: products } = await supabase.from('products').select('*, categories(name)')
    if (products) {
      setLiveItems(products.length)
      const grouped: Record<string, number> = {}
      for (const p of products as any[]) {
        const catName = p.categories?.name || 'Uncategorized'
        grouped[catName] = (grouped[catName] || 0) + 1
      }
      setStockBreakdown(Object.entries(grouped).map(([name, count]) => ({ name, count })))
    }

    const { count: lowStock } = await supabase
      .from('low_stock_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('is_resolved', false)
    setLowStockCount(lowStock || 0)

    const { count: creditAlerts } = await supabase
      .from('credit_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('is_resolved', false)
    setCreditAlertCount(creditAlerts || 0)
  }, [])

  // Notification tap: new_order=<id> URL param thi direct popup open karo
  useEffect(() => {
    if (!newOrderId) return
    async function loadOrderFromUrl() {
      const { data: order } = await supabase.from('orders').select('*').eq('id', newOrderId).single()
      if (!order) return
      const { data: items } = await supabase.from('order_items').select('*').eq('order_id', newOrderId)
      setNewOrderAlert({ order: order as Order, items: (items as OrderItem[]) || [] })
    }
    loadOrderFromUrl()
  }, [newOrderId])

  useEffect(() => {
    load()

    // Realtime: navo order aave tyare home screen par popup
    // Realtime: navo order aave tyare home screen par popup
    const playNotificationSound = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioCtx) return
        const ctx = new AudioCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.type = 'sine'
        // Play a pleasant double chime (bell sound)
        osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        osc.start()
        
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12) // A5
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        osc.stop(ctx.currentTime + 0.6)
      } catch (e) {
        console.error('Failed to play notification sound:', e)
      }
    }

    const channel = supabase
      .channel('admin-new-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          const order = payload.new as Order
          const { data: items } = await supabase.from('order_items').select('*').eq('order_id', order.id)
          setNewOrderAlert({ order, items: (items as OrderItem[]) || [] })
          
          // Play sound alert
          playNotificationSound()
          
          // browser notification (if permitted)
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('નવો ઓર્ડર! 🛍️', { body: `${order.shop_name_snapshot} - ₹${order.total_amount}` })
          }
          load()
        }
      )
      .subscribe()

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  async function handleOrderAction(status: 'processing' | 'pending' | 'cancelled') {
    if (!newOrderAlert) return
    setActionLoading(true)
    await supabase.from('orders').update({ status }).eq('id', newOrderAlert.order.id)

    // shopkeeper ne notify karo - admin e action lidhu
    const statusLabels: Record<string, string> = {
      processing: '✅ Accept - તમારો ઓર્ડર accept થઈ ગયો!',
      pending: '⏳ Pending - ઓર્ડર pending છે, રાહ જુઓ',
      cancelled: '❌ Decline - ઓર્ડર decline થયો',
    }
    await triggerPush({
      title: 'GGM&S Wholesale - ઓર્ડર Update 📦',
      body: statusLabels[status] || 'ઓર્ડર status update',
      url: `/orders/${newOrderAlert.order.id}`,
      shop_id: newOrderAlert.order.shop_id || undefined,
    })

    setActionLoading(false)
    setNewOrderAlert(null)
    setReplyText('')
    load()
  }

  async function sendReplyAndClose() {
    if (!newOrderAlert || !replyText.trim()) return
    setActionLoading(true)
    await supabase
      .from('orders')
      .update({ admin_reply: replyText.trim(), admin_reply_at: new Date().toISOString() })
      .eq('id', newOrderAlert.order.id)

    // shopkeeper ne push notification moklavo - reply aavyo
    await triggerPush({
      title: 'GGM&S - ઓર્ડર Reply 📩',
      body: replyText.trim(),
      url: `/orders/${newOrderAlert.order.id}`,
      shop_id: newOrderAlert.order.shop_id || undefined,
    })

    setActionLoading(false)
    setNewOrderAlert(null)
    setReplyText('')
    load()
  }

  return (
    <div className="p-5 space-y-4">
      <h1 className="text-xl font-extrabold text-slate-900">Dashboard</h1>

      {(lowStockCount > 0 || creditAlertCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lowStockCount > 0 && (
            <Link
              href="/admin/inventory"
              className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 font-bold text-sm flex items-center justify-between"
            >
              ⚠️ {lowStockCount} પ્રોડક્ટ Low Stock માં છે
              <span className="text-xs underline">જુઓ →</span>
            </Link>
          )}
          {creditAlertCount > 0 && (
            <Link
              href="/admin/shops"
              className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-700 font-bold text-sm flex items-center justify-between"
            >
              ⚠️ {creditAlertCount} દુકાનની ઉધાર લિમિટ ક્રોસ થઈ
              <span className="text-xs underline">જુઓ →</span>
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Total Sales</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">₹{totalSales.toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Total Orders</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Pending Orders</p>
          <p className="text-2xl font-extrabold text-amber-500 mt-1">{pendingOrders}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Live Items</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{liveItems}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-slate-800 mb-3">Stock Breakdown</h2>
        <div className="space-y-2.5">
          {stockBreakdown.map((s) => (
            <div key={s.name} className="flex justify-between items-center">
              <span className="text-sm text-slate-600">{s.name}</span>
              <span className="text-xs font-bold bg-slate-100 px-2.5 py-1 rounded-full text-slate-600">
                {s.count} items
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-slate-800 mb-3">Recent Orders</h2>
        <div className="space-y-3">
          {recentOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-slate-800">{order.order_number}</p>
                <p className="text-xs text-slate-400">{order.shop_name_snapshot}</p>
              </div>
              <p className="font-bold text-sm text-slate-800">₹{order.total_amount}</p>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  order.status === 'delivered'
                    ? 'bg-green-50 text-green-600'
                    : order.status === 'pending'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-blue-50 text-blue-600'
                }`}
              >
                {order.status}
              </span>
              <Link href={`/admin/orders/${order.id}`} className="text-green-600 text-xs font-bold">
                View
              </Link>
            </div>
          ))}
          {recentOrders.length === 0 && <p className="text-sm text-slate-400">કોઈ ઓર્ડર નથી</p>}
        </div>
      </div>

      {/* New Order Popup */}
      {newOrderAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto">
            <div className="bg-green-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} />
                <p className="font-extrabold">નવો ઓર્ડર આવ્યો!</p>
              </div>
              <button onClick={() => setNewOrderAlert(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <p className="font-bold text-slate-900">{newOrderAlert.order.shop_name_snapshot}</p>
                <p className="text-xs text-slate-400">
                  {newOrderAlert.order.order_number} • {newOrderAlert.order.shop_phone_snapshot}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                {newOrderAlert.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-700">
                      {item.product_name_snapshot} ({item.qty} {item.unit_snapshot})
                    </span>
                    <span className="font-bold text-slate-800">₹{item.line_total}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-extrabold text-green-600 text-lg">₹{newOrderAlert.order.total_amount}</span>
              </div>

              <p className="text-xs text-slate-400">
                Payment: <span className="font-bold text-slate-600">{newOrderAlert.order.payment_method === 'udhar' ? 'ઉધાર' : 'Cash'}</span>
                {' • '}
                {newOrderAlert.order.delivery_mode === 'pickup' ? 'Pick Up' : 'Shop Delivery'}
              </p>

              {/* Accept / Pending / Decline */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  onClick={() => handleOrderAction('processing')}
                  disabled={actionLoading}
                  className="bg-green-50 text-green-700 font-bold py-2.5 rounded-xl flex flex-col items-center gap-1 text-xs disabled:opacity-50"
                >
                  <CheckCircle2 size={18} /> Accept
                </button>
                <button
                  onClick={() => handleOrderAction('pending')}
                  disabled={actionLoading}
                  className="bg-amber-50 text-amber-700 font-bold py-2.5 rounded-xl flex flex-col items-center gap-1 text-xs disabled:opacity-50"
                >
                  <Clock size={18} /> Pending
                </button>
                <button
                  onClick={() => handleOrderAction('cancelled')}
                  disabled={actionLoading}
                  className="bg-red-50 text-red-700 font-bold py-2.5 rounded-xl flex flex-col items-center gap-1 text-xs disabled:opacity-50"
                >
                  <XCircle size={18} /> Decline
                </button>
              </div>

              {/* Reply to shopkeeper */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <MessageCircle size={13} /> Shopkeeper ને Reply મોકલો
                </p>
                <div className="flex gap-2">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="દા.ત. 'ઓર્ડર 1 કલાકમાં મોકલીશ'"
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                  <button
                    onClick={sendReplyAndClose}
                    disabled={actionLoading || !replyText.trim()}
                    className="bg-slate-900 text-white px-3 rounded-xl disabled:opacity-40"
                  >
                    <Send size={16} />
                  </button>
                </div>
                <a
                  href={buildWhatsAppUrl(newOrderAlert.order, newOrderAlert.items, null)}
                  target="_blank"
                  className="mt-2 w-full bg-green-50 text-green-700 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5"
                >
                  WhatsApp પર reply કરો
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
