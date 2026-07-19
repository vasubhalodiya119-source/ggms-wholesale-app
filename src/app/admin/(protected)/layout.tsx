'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/lib/admin-auth'
import AdminSidebar from '@/components/AdminSidebar'
import { supabase } from '@/lib/supabase'
import { Bell, X } from 'lucide-react'

type GlobalOrderAlert = {
  id: string
  shopName: string
  totalAmount: number
}

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdminAuth()
  const router = useRouter()
  const [globalAlert, setGlobalAlert] = useState<GlobalOrderAlert | null>(null)

  useEffect(() => {
    if (!admin) return

    const playNotificationSound = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioCtx) return
        const ctx = new AudioCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.type = 'sine'
        // Play a pleasant double chime (bell sound)
        osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        osc.start()
        
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12) // A5
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        osc.stop(ctx.currentTime + 0.6)
      } catch (e) {
        console.error('Failed to play notification sound:', e)
      }
    }

    const channel = supabase
      .channel('global-admin-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const order = payload.new as any
          setGlobalAlert({
            id: order.id,
            shopName: order.shop_name_snapshot || 'Unknown Shop',
            totalAmount: order.total_amount || 0
          })
          
          playNotificationSound()

          // Browser notification as fallback
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('નવો ઓર્ડર! 🛍️', { body: `${order.shop_name_snapshot} - ₹${order.total_amount}` })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [admin])

  useEffect(() => {
    if (!loading && !admin) {
      window.location.href = '/admin'
    }
  }, [loading, admin])

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
    </div>
  )
  if (!admin) return null

  return (
    <div className="min-h-screen flex bg-slate-50 relative">
      {/* Global In-App Notification Banner */}
      {globalAlert && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[9999] animate-slide-down">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 flex gap-3 items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0 animate-bounce">
                <Bell size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">નવો ઓર્ડર મળ્યો! 🛍️</p>
                <p className="text-sm font-extrabold truncate text-white">{globalAlert.shopName}</p>
                <p className="text-xs font-bold text-green-400">કુલ રકમ: ₹{globalAlert.totalAmount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  router.push(`/admin/dashboard?new_order=${globalAlert.id}`)
                  setGlobalAlert(null)
                }}
                className="bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold text-xs px-3 py-2 rounded-xl transition duration-150"
              >
                ઓર્ડર જુઓ
              </button>
              <button
                onClick={() => setGlobalAlert(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar - hidden on mobile */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-100 hidden md:block bg-white">
        <AdminSidebar />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile top header with hamburger - only visible on mobile */}
        <div className="md:hidden">
          <AdminSidebar />
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
