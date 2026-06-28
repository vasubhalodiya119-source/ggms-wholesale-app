'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Store, Phone, Lock } from 'lucide-react'
import { useAdminAuth } from '@/lib/admin-auth'

export default function AdminLoginPage() {
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
    else router.push('/admin/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full bg-slate-50">
      <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white mb-4 shadow-sm">
        <Store size={28} />
      </div>
      <h1 className="text-xl font-extrabold text-slate-900">Admin Console</h1>
      <p className="text-sm text-slate-400 mt-1 mb-6">BACKOFFICE LOGIN</p>

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
          className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-2xl mt-2 disabled:opacity-60"
        >
          {loading ? 'લોગિન થઈ રહ્યું છે...' : 'LOGIN'}
        </button>
      </form>
    </div>
  )
}
