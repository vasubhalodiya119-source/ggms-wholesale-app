'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBasket, Heart, ShoppingCart, LogOut, BookUser, Megaphone, Download, Share2, AlertCircle, CheckCircle, Settings2 } from 'lucide-react'
import { useShopAuth } from '@/lib/shop-auth'
import { supabase } from '@/lib/supabase'
import { Settings } from '@/lib/types'
import { getPushPermissionStatus, subscribeToPush, getPushLogs, clearPushLogs } from '@/lib/push'

export default function AccountPage() {
  const { shop, loading, logout } = useShopAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [pushStatus, setPushStatus] = useState<'granted' | 'denied' | 'prompt' | 'loading'>('loading')
  const [isRegistering, setIsRegistering] = useState(false)
  const [logs, setLogs] = useState<Array<{ time: string; message: string; isError: boolean }>>([])

  useEffect(() => {
    if (!loading && !shop) router.push('/login?redirect=/account')
  }, [loading, shop, router])

  useEffect(() => {
    supabase.from('settings').select('*').eq('id', 1).single().then(({ data }) => {
      setSettings(data as Settings)
    })
  }, [])

  useEffect(() => {
    if (shop) {
      getPushPermissionStatus().then(status => {
        setPushStatus(status)
      })
    }
  }, [shop])

  useEffect(() => {
    setLogs(getPushLogs())
    const handleLogsChanged = () => {
      setLogs(getPushLogs())
    }
    window.addEventListener('ggms_push_logs_changed', handleLogsChanged)
    return () => {
      window.removeEventListener('ggms_push_logs_changed', handleLogsChanged)
    }
  }, [])

  async function handleTestRegister() {
    if (!shop) return
    setIsRegistering(true)
    try {
      await subscribeToPush(shop.id)
      const newStatus = await getPushPermissionStatus()
      setPushStatus(newStatus)
      alert('નોટિફિકેશન રજીસ્ટ્રેશન પ્રોસેસ પૂર્ણ થઈ! જો પરમિશન ડાયલોગ આવ્યો હોય તો Allow આપો.')
    } catch (e) {
      console.error(e)
      alert('ભૂલ થઈ: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setIsRegistering(false)
    }
  }

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

      {/* Push Notification Diagnostics */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
            <Megaphone size={16} className="text-purple-500" /> નોટિફિકેશન સ્ટેટસ (Push Check)
          </h3>
          <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 ${
            pushStatus === 'granted' ? 'bg-green-50 text-green-600' :
            pushStatus === 'denied' ? 'bg-red-50 text-red-600' :
            pushStatus === 'prompt' ? 'bg-amber-50 text-amber-600' :
            'bg-slate-50 text-slate-400'
          }`}>
            {pushStatus === 'granted' && <><CheckCircle size={12} /> ચાલુ છે (Allowed)</>}
            {pushStatus === 'denied' && <><AlertCircle size={12} /> બંધ છે (Denied)</>}
            {pushStatus === 'prompt' && <><AlertCircle size={12} /> બાકી છે (Prompt)</>}
            {pushStatus === 'loading' && 'Checking...'}
          </span>
        </div>

        {pushStatus === 'denied' && (
          <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 text-[11px] text-red-600 space-y-1">
            <p className="font-bold">⚠️ નોટિફિકેશન બ્લોક કરેલ છે:</p>
            <p>તમારા ફોન માં નોટિફિકેશન બંધ હોવાથી એડમિન પેનલના મેસેજ આવી શકશે નહીં. ચાલુ કરવા માટે:</p>
            <ol className="list-decimal list-inside mt-1 ml-1 space-y-0.5">
              <li>ફોનના <b>Settings (સેટિંગ્સ)</b> માં જાઓ.</li>
              <li><b>Apps</b> (અથવા Application Manager) પર ક્લિક કરો.</li>
              <li><b>GGM&S Wholesale</b> એપ શોધો.</li>
              <li><b>Notifications</b> માં જઈને <b>Allow (ચાલુ)</b> કરો.</li>
            </ol>
          </div>
        )}

        <button
          onClick={handleTestRegister}
          disabled={isRegistering}
          className="w-full bg-purple-50 border border-purple-200 hover:bg-purple-100/70 text-purple-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {isRegistering ? 'પ્રોસેસ ચાલુ છે...' : 'નોટિફિકેશન ફરી એક્ટિવેટ / ટેસ્ટ કરો'}
        </button>

        {/* Real-time Push Logs */}
        <div className="pt-2 border-t border-slate-100 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
            <span>સિસ્ટમ લૉગ્સ (System Logs)</span>
            <button onClick={() => clearPushLogs()} className="text-purple-500 hover:underline normal-case">Clear</button>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 max-h-32 overflow-y-auto font-mono text-[9px] text-slate-500 space-y-1">
            {logs.length === 0 ? (
              <p className="text-slate-400 italic">કોઈ લૉગ્સ ઉપલબ્ધ નથી</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`flex items-start gap-1 ${log.isError ? 'text-red-500' : 'text-slate-600'}`}>
                  <span className="text-slate-400 flex-shrink-0">[{new Date(log.time).toLocaleTimeString()}]</span>
                  <span className="break-all">{log.message}</span>
                </div>
              ))
            )}
          </div>
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
        <a
          href={settings?.app_download_url || '/GGMS-Wholesale.apk'}
          download="GGMS-Wholesale.apk"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-green-600 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2"
        >
          <Download size={16} /> Download App / એપ ડાઉનલોડ કરો
        </a>
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
