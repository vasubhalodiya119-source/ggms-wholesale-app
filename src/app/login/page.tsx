'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Phone, User } from 'lucide-react'
import { useShopAuth } from '@/lib/shop-auth'

function LoginContent() {
  const [phone, setPhone] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useShopAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await login(phone, ownerName)
    setLoading(false)
    if (error) setError(error)
    else router.push(redirect)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 sm:max-w-md sm:mx-auto w-full">
      <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm mb-4">
        <Image src="/logo.png" alt="GGM&S" width={80} height={80} className="object-cover w-full h-full" />
      </div>
      <h1 className="text-xl font-extrabold text-slate-900">GGM&amp;S Wholesale</h1>
      <p className="text-sm text-slate-400 mt-1 mb-6">દુકાનદાર લોગિન</p>

      <form onSubmit={handleSubmit} className="w-full space-y-3">
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
          <User size={18} className="text-slate-400" />
          <input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="તમારું નામ"
            required
            className="flex-1 outline-none text-sm"
          />
        </div>

        {error && <p className="text-red-600 text-xs font-semibold px-1">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white font-bold py-3.5 rounded-2xl mt-2 disabled:opacity-60"
        >
          {loading ? 'લોગિન થઈ રહ્યું છે...' : 'લોગિન'}
        </button>
      </form>

      <p className="text-sm text-slate-500 mt-6">
        નવા છો?{' '}
        <Link href={`/signup?redirect=${redirect}`} className="text-green-600 font-bold">
          એકાઉન્ટ બનાવો
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}
