'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBasket, Store, User, Phone, Lock, MapPin } from 'lucide-react'
import { useShopAuth } from '@/lib/shop-auth'

function SignupContent() {
  const [shopName, setShopName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useShopAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signup({ shop_name: shopName, owner_name: ownerName, phone, password, address })
    setLoading(false)
    if (error) setError(error)
    else router.push(redirect)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full py-8">
      <div className="w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center text-white mb-4 shadow-sm">
        <ShoppingBasket size={30} />
      </div>
      <h1 className="text-xl font-extrabold text-slate-900">નવું એકાઉન્ટ બનાવો</h1>
      <p className="text-sm text-slate-400 mt-1 mb-6">દુકાનની માહિતી ભરો</p>

      <form onSubmit={handleSubmit} className="w-full space-y-3">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-3">
          <Store size={18} className="text-slate-400" />
          <input
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="દુકાનનું નામ"
            required
            className="flex-1 outline-none text-sm"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-3">
          <User size={18} className="text-slate-400" />
          <input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="માલિકનું નામ"
            className="flex-1 outline-none text-sm"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-3">
          <Phone size={18} className="text-slate-400" />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="ફોન નંબર"
            type="tel"
            required
            className="flex-1 outline-none text-sm"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-3">
          <Lock size={18} className="text-slate-400" />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="પાસવર્ડ"
            type="password"
            required
            className="flex-1 outline-none text-sm"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-3">
          <MapPin size={18} className="text-slate-400" />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="દુકાનનું સરનામું"
            className="flex-1 outline-none text-sm"
          />
        </div>

        {error && <p className="text-red-600 text-xs font-semibold px-1">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white font-bold py-3.5 rounded-2xl mt-2 disabled:opacity-60"
        >
          {loading ? 'બની રહ્યું છે...' : 'એકાઉન્ટ બનાવો'}
        </button>
      </form>

      <p className="text-sm text-slate-500 mt-6">
        પહેલેથી એકાઉન્ટ છે?{' '}
        <Link href={`/login?redirect=${redirect}`} className="text-green-600 font-bold">
          લોગિન
        </Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupContent />
    </Suspense>
  )
}
