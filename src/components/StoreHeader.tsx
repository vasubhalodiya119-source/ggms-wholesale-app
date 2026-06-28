'use client'

import Link from 'next/link'
import { ShoppingCart, ShoppingBasket, User } from 'lucide-react'
import { useCart } from '@/lib/cart-context'

export default function StoreHeader() {
  const { uniqueCount } = useCart()

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white shadow-sm">
          <ShoppingBasket size={22} />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 leading-tight text-base">GGM&amp;S Grocery</h1>
          <p className="text-[11px] tracking-wide text-slate-400 font-semibold uppercase">Wholesale &amp; Retail</p>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/cart"
          className="relative w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50"
        >
          <ShoppingCart size={19} />
          {uniqueCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {uniqueCount}
            </span>
          )}
        </Link>
        <Link
          href="/account"
          className="w-10 h-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-700 hover:bg-green-100"
        >
          <User size={19} />
        </Link>
      </div>
    </header>
  )
}
