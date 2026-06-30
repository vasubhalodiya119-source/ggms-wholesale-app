'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBasket, Heart, ShoppingCart, LogOut, BookUser, Megaphone, Download, Share2 } from 'lucide-react'
import { useShopAuth } from '@/lib/shop-auth'
import { supabase } from '@/lib/supabase'
import { Settings } from '@/lib/types'

export default function AccountPage() {
  const { shop, loading, logout } = useShopAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    if (!loading && !shop) router.push('/login?redirect=/account')
  }, [loading, shop, router])

  useEffect(() => {
    supabase.from('settings').select('*').eq('id', 1).single().then(({ data }) => {
      setSettings(data as Settings)
    })
  }, [])

  async function handleShare() {
    const url = window.location.origin
    if (navigator.share) {
      await navigator.share({ title: 'GGM&S Wholesale', text: 'ઓર્ડર કરવા માટે app download કરો', url })
    } else {
      await navigator.clipboard.writeText(url)
      alert('Link copied!')
    }
  }

  if (loading || !shop) return <div className="p-6 text-center text-sm text-slate-400">Loading...</div>

  return (
    <div className="px-4 pt-3 space-y-4 pb-4">
      <h1 className="text-xl font-extrabold text-slate-900">My Account</h1>
      <p className="text-sm text-slate-400 -mt-2">Manage your profile, orders, and more</p>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center text-2xl font-extrabold text-green-600 mb-2">
          {shop.shop_name?.[0]?.toUpperCase() || 'G'}
        </div>
        <p className="font-bold text-slate-900">{shop.shop_name}</p>
        <p className="text-sm text-slate-400">{shop.phone}</p>

        <div className="w-full mt-4 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-4 text-left">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold bg-white/30 text-white px-2 py-0.5 rounded-full">
              GGM&amp;S CLUB
            </span>
          </div>
          <p className="text-[11px] font-bold text-white/90">બાકી રકમ (Udhar Balance)</p>
          <p className="text-2xl font-extrabold text-white">₹{shop.current_balance}</p>
          {shop.credit_limit > 0 && (
            <p className="text-[11px] text-white/80 mt-1">ઉધાર લિમિટ: ₹{shop.credit_limit}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/orders" className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center gap-2">
          <ShoppingBasket size={26} className="text-blue-500" />
          <span className="font-bold text-slate-800 text-sm">My Orders</span>
        </Link>
        <Link href="/ledger" className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center gap-2">
          <BookUser size={26} className="text-orange-500" />
          <span className="font-bold text-slate-800 text-sm">ઉધાર ખાતું</span>
        </Link>
        <Link href="/wishlist" className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center gap-2">
          <Heart size={26} className="text-red-500" />
          <span className="font-bold text-slate-800 text-sm">Wishlist</span>
        </Link>
        <Link href="/cart" className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center gap-2">
          <ShoppingCart size={26} className="text-green-600" />
          <span className="font-bold text-slate-800 text-sm">Cart</span>
        </Link>
        <Link href="/notifications" className="col-span-2 bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
          <Megaphone size={22} className="text-purple-500" />
          <span className="font-bold text-slate-800 text-sm">Notifications</span>
        </Link>
      </div>

      {/* Share + Download */}
      <div className="space-y-2">
        <button
          onClick={handleShare}
          className="w-full bg-white border border-slate-200 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-slate-700"
        >
          <Share2 size={16} /> Share App / એપ શેર કરો
        </button>
        {settings?.app_download_url ? (
          <a
            href={settings.app_download_url}
            download="GGMS-Wholesale.apk"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-green-600 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2"
          >
            <Download size={16} /> Download App / એપ ડાઉનલોડ કરો
          </a>
        ) : (
          <button className="w-full bg-green-600 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 opacity-50" disabled>
            <Download size={16} /> Download App / એપ ડાઉનલોડ કરો
          </button>
        )}
      </div>

      <button
        onClick={() => { logout(); router.push('/') }}
        className="w-full bg-white border border-red-200 text-red-500 font-bold py-3 rounded-2xl flex items-center justify-center gap-2"
      >
        <LogOut size={16} /> LOGOUT
      </button>
    </div>
  )
}
