'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowUp, ArrowDown, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Shop, Order } from '@/lib/types'

type LedgerEntry = {
  id: string
  type: string
  amount: number
  note: string | null
  created_at: string
}

export default function AdminShopLedgerPage() {
  const params = useParams()
  const router = useRouter()
  const shopId = params.id as string
  const [shop, setShop] = useState<Shop | null>(null)
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')

  async function load() {
    const { data: s } = await supabase.from('shops').select('*').eq('id', shopId).single()
    setShop(s as Shop)

    const { data: l } = await supabase
      .from('payment_ledger')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
    setEntries((l as LedgerEntry[]) || [])

    const { data: o } = await supabase
      .from('orders')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
      .limit(10)
    setOrders((o as Order[]) || [])
  }

  useEffect(() => {
    load()
  }, [shopId])

  async function recordPayment() {
    if (!shop) return
    const amount = parseFloat(paymentAmount) || 0
    if (amount <= 0) return

    await supabase
      .from('shops')
      .update({ current_balance: Number(shop.current_balance) - amount })
      .eq('id', shop.id)

    await supabase.from('payment_ledger').insert({
      shop_id: shop.id,
      type: 'payment_received',
      amount: -amount,
      note: 'ચુકવણી મળી (Payment received)',
    })

    setShowPaymentForm(false)
    setPaymentAmount('')
    load()
  }

  if (!shop) return <div className="p-6 text-sm text-slate-400">Loading...</div>

  return (
    <div className="p-5 max-w-2xl space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 text-sm font-bold">
        <ArrowLeft size={16} /> Back to Shops
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h1 className="text-lg font-extrabold text-slate-900">{shop.shop_name}</h1>
        <p className="text-sm text-slate-500">{shop.owner_name} • {shop.phone}</p>
        {shop.address && <p className="text-xs text-slate-400 mt-1">{shop.address}</p>}

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-amber-50 rounded-xl p-3">
            <p className="text-[11px] font-bold text-amber-600">બાકી રકમ</p>
            <p className="text-xl font-extrabold text-amber-700">₹{shop.current_balance}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[11px] font-bold text-slate-500">ઉધાર લિમિટ</p>
            <p className="text-xl font-extrabold text-slate-700">₹{shop.credit_limit || '∞'}</p>
          </div>
        </div>

        <button
          onClick={() => setShowPaymentForm(true)}
          className="w-full mt-4 bg-green-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-sm"
        >
          <Plus size={16} /> ચુકવણી નોંધો (Record Payment)
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-slate-800 mb-3">Recent Orders</h2>
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="flex justify-between text-sm">
              <span className="text-slate-600">{o.order_number}</span>
              <span className="font-bold text-slate-800">₹{o.total_amount}</span>
            </div>
          ))}
          {orders.length === 0 && <p className="text-sm text-slate-400">કોઈ ઓર્ડર નથી</p>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-slate-800 mb-3">Ledger History</h2>
        <div className="divide-y divide-slate-100">
          {entries.map((entry) => {
            const isCredit = entry.amount < 0
            return (
              <div key={entry.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCredit ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {isCredit ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{entry.note}</p>
                    <p className="text-xs text-slate-400">{new Date(entry.created_at).toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <p className={`font-bold text-sm ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                  {isCredit ? '-' : '+'}₹{Math.abs(entry.amount)}
                </p>
              </div>
            )
          })}
          {entries.length === 0 && <p className="text-sm text-slate-400">કોઈ ટ્રાન્ઝેક્શન નથી</p>}
        </div>
      </div>

      {showPaymentForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3">
            <h2 className="font-bold text-lg">ચુકવણી નોંધો</h2>
            <input
              type="number"
              placeholder="રકમ"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setShowPaymentForm(false)} className="flex-1 border border-slate-200 font-bold py-2.5 rounded-xl text-sm">
                Cancel
              </button>
              <button onClick={recordPayment} className="flex-1 bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
