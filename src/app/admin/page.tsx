'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Phone, Lock } from 'lucide-react'
import { useAdminAuth } from '@/lib/admin-auth'

export default function AdminLoginPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    // Override manifest so "Add to Home Screen" shows "GGM&S Wholesale"
    let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement
    if (!link) {
      link = document.createElement('link')
      link.rel = 'manifest'
      document.head.appendChild(link)
    }
    link.href = '/admin-manifest.json'
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await login(phone, password)
    setLoading(false)
    if (error) setError(error)
    else router.push('/admin/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full bg-slate-50">
      <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm mb-4">
        <Image src="/logo.png" alt="GGM&S" width={80} height={80} className="object-cover w-full h-full" />
      </div>
      <h1 className="text-xl font-extrabold text-slate-900">GGM&amp;S Wholesale</h1>
      <p className="text-sm text-slate-400 mt-1 mb-6">ADMIN BACKOFFICE</p>

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

        {error && <p className="text-red-600 text-xs font-semibold px-1">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white font-bold py-3.5 rounded-2xl mt-2 disabled:opacity-60"
        >
          {loading ? 'લોગિન થઈ રહ્યું છે...' : 'LOGIN'}
        </button>
      </form>
    </div>
  )
}
