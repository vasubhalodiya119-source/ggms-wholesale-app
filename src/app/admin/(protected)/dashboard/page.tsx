'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Order } from '@/lib/types'

type CategoryStock = { name: string; count: number }

export default function AdminDashboard() {
  const [totalSales, setTotalSales] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [pendingOrders, setPendingOrders] = useState(0)
  const [liveItems, setLiveItems] = useState(0)
  const [stockBreakdown, setStockBreakdown] = useState<CategoryStock[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [lowStockCount, setLowStockCount] = useState(0)
  const [creditAlertCount, setCreditAlertCount] = useState(0)

  useEffect(() => {
    async function load() {
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
    }
    load()
  }, [])

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
    </div>
  )
}
