'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Phone, Lock } from 'lucide-react'
import { useAdminAuth } from '@/lib/admin-auth'

export default function AdminAppLoginPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAdminAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await login(phone, password)
    setLoading(false)
    if (error) setError(error)
    else router.push('/admin-app/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-white shadow-2xl border-4 border-yellow-400 mb-3">
            <Image src="/admin-logo.png" alt="GGM&S" width={128} height={128} className="object-cover w-full h-full" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide">GGM&amp;S WHOLESALE</h1>
          <p className="text-green-300 text-xs font-semibold tracking-widest uppercase mt-1">Admin Panel</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-3.5">
            <Phone size={18} className="text-green-300" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="ફોન નંબર"
              type="tel"
              required
              className="flex-1 outline-none bg-transparent text-white placeholder:text-green-300 text-sm"
            />
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-3.5">
            <Lock size={18} className="text-green-300" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="પાસવર્ડ"
              type="password"
              required
              className="flex-1 outline-none bg-transparent text-white placeholder:text-green-300 text-sm"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-3 py-2">
              <p className="text-red-300 text-xs font-semibold">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 text-green-900 font-extrabold py-4 rounded-2xl text-base disabled:opacity-60 shadow-lg mt-2"
          >
            {loading ? 'Login થઈ રહ્યું છે...' : 'LOGIN'}
          </button>
        </form>
      </div>
    </div>
  )
}
