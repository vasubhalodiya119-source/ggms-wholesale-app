'use client'

import { useState, useEffect } from 'react'
import { useShopAuth } from '@/lib/shop-auth'
import { subscribeToPush } from '@/lib/push'
import { Bell } from 'lucide-react'

export default function NotificationPrompt() {
  const { shop } = useShopAuth()
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined' || !('Notification' in window)) return

    // If already granted or denied, don't show
    if (Notification.permission !== 'default') return
    
    // Check if user previously declined the custom prompt
    if (localStorage.getItem('ggms_push_declined') === 'true') return

    // Show if they are logged in
    if (shop) {
      // Small delay so it doesn't pop up immediately on first render
      const timer = setTimeout(() => setShow(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [shop])

  if (!show) return null

  const handleAllow = async () => {
    setShow(false)
    if (shop) {
      await subscribeToPush(shop.id)
    }
  }

  const handleDeny = () => {
    setShow(false)
    localStorage.setItem('ggms_push_declined', 'true')
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-xl max-w-[320px] w-full p-6 text-center animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Decorative background element if needed, though simple white is fine */}
        
        <div className="mx-auto w-14 h-14 bg-sky-100 rounded-full flex items-center justify-center mb-5">
          <Bell className="w-7 h-7 text-sky-700" fill="currentColor" />
        </div>
        
        <h2 className="text-[19px] font-semibold text-slate-800 mb-6 leading-snug">
          Allow <span className="font-bold">GGM&S Grocery</span> to send you notifications?
        </h2>
        
        <div className="flex flex-col gap-3 w-full">
          <button 
            onClick={handleAllow}
            className="w-full bg-sky-100/70 hover:bg-sky-200 text-sky-900 font-medium py-3.5 rounded-xl transition-colors text-[15px]"
          >
            ALLOW
          </button>
          
          <button 
            onClick={handleDeny}
            className="w-full bg-sky-100/70 hover:bg-sky-200 text-sky-900 font-medium py-3.5 rounded-xl transition-colors text-[15px]"
          >
            DON'T ALLOW
          </button>
        </div>
      </div>
    </div>
  )
}
