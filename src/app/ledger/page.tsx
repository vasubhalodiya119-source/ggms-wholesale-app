'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useShopAuth } from '@/lib/shop-auth'

type LedgerEntry = {
  id: string
  type: string
  amount: number
  note: string | null
  created_at: string
}

export default function LedgerPage() {
  const { shop, loading } = useShopAuth()
  const router = useRouter()
  const [entries, setEntries] = useState<LedgerEntry[]>([])

  useEffect(() => {
    if (!loading && !shop) router.push('/login?redirect=/ledger')
  }, [loading, shop, router])

  useEffect(() => {
    if (!shop) return
    supabase
      .from('payment_ledger')
      .select('*')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setEntries((data as LedgerEntry[]) || []))
  }, [shop])

  if (!shop) return null

  return (
    <div className="px-4 pt-3 pb-4 sm:max-w-md sm:mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-extrabold text-slate-900">ઉધાર ખાતું</h1>
      </div>

      <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-4 mb-4 text-white">
        <p className="text-[11px] font-bold text-white/90">હાલની બાકી રકમ</p>
        <p className="text-2xl font-extrabold">₹{shop.current_balance}</p>
        {shop.credit_limit > 0 && <p className="text-[11px] text-white/80 mt-1">લિમિટ: ₹{shop.credit_limit}</p>}
      </div>

      {entries.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-10">કોઈ ટ્રાન્ઝેક્શન નથી</p>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {entries.map((entry) => {
            const isCredit = entry.amount < 0
            return (
              <div key={entry.id} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isCredit ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {isCredit ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{entry.note || (isCredit ? 'ચુકવણી' : 'ઓર્ડર ઉધાર')}</p>
                    <p className="text-xs text-slate-400">{new Date(entry.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
                <p className={`font-bold text-sm ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                  {isCredit ? '-' : '+'}₹{Math.abs(entry.amount)}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
