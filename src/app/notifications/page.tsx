'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Megaphone, Tag, Bell, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Broadcast } from '@/lib/types'

type ParsedBroadcast = {
  id: string
  created_at: string
  isRich: boolean
  type: string
  title: string
  message: string
  image: string
  buttonText: string
  buttonLink: string
}

export default function NotificationsPage() {
  const router = useRouter()
  const [rawBroadcasts, setRawBroadcasts] = useState<Broadcast[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('broadcasts')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRawBroadcasts((data as Broadcast[]) || [])
        setLoading(false)
      })
  }, [])

  // Parse JSON payloads on the fly for rich notifications
  const parsedBroadcasts = useMemo<ParsedBroadcast[]>(() => {
    return rawBroadcasts.map(b => {
      let isRich = false
      let details: any = {}
      try {
        if (b.message.trim().startsWith('{')) {
          details = JSON.parse(b.message)
          isRich = true
        }
      } catch (e) {
        isRich = false
      }

      return {
        id: b.id,
        created_at: b.created_at,
        isRich,
        type: details.type || 'info',
        title: details.title || 'Notification',
        message: isRich ? details.message : b.message,
        image: details.image || '',
        buttonText: details.buttonText || '',
        buttonLink: details.buttonLink || ''
      }
    })
  }, [rawBroadcasts])

  const handleActionClick = (link: string) => {
    if (!link) return
    router.push(link)
  }

  return (
    <div className="px-4 pt-3 pb-6 sm:max-w-md sm:mx-auto min-h-screen bg-slate-50">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button 
          onClick={() => router.back()} 
          className="p-1.5 rounded-xl bg-white border border-slate-100 text-slate-600 active:bg-slate-100 shadow-xs"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-black text-slate-900 uppercase">Notifications</h1>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading updates...</p>
        </div>
      ) : parsedBroadcasts.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-slate-200 p-8 flex flex-col items-center text-center shadow-xs">
          <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-3">
            <Bell size={24} className="text-slate-300 animate-pulse" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-sm mb-1">હજુ કોઈ નોટિફિકેશન નથી</h3>
          <p className="text-xs text-slate-450">નવી જાહેરાતો અને ઓફર્સ અહીં જોવા મળશે.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {parsedBroadcasts.map((b) => {
            if (b.isRich) {
              return (
                <div 
                  key={b.id} 
                  className="bg-white rounded-[24px] border border-slate-150 overflow-hidden shadow-xs hover:border-slate-300 transition-colors"
                >
                  {/* Category Badge & Image attachment */}
                  {b.image && (
                    <div className="w-full h-36 overflow-hidden bg-slate-100 border-b border-slate-100 relative">
                      <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
                      <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm ${
                        b.type === 'offer' ? 'bg-green-600 text-white' :
                        b.type === 'info' ? 'bg-blue-600 text-white' :
                        b.type === 'notice' ? 'bg-amber-500 text-white' :
                        'bg-slate-700 text-white'
                      }`}>
                        {b.type === 'offer' ? '🎉 Offer' : b.type === 'info' ? '📢 Info' : b.type === 'notice' ? '⚠️ Notice' : '⚙️ Custom'}
                      </span>
                    </div>
                  )}

                  <div className="p-4 space-y-2.5">
                    {/* Non-image category badge */}
                    {!b.image && (
                      <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                        b.type === 'offer' ? 'bg-green-50 text-green-700 border border-green-100' :
                        b.type === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        b.type === 'notice' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-slate-50 text-slate-700 border border-slate-200'
                      }`}>
                        {b.type}
                      </span>
                    )}

                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-slate-900 leading-snug">{b.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{b.message}</p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        {new Date(b.created_at).toLocaleDateString('gu-IN', { 
                          day: 'numeric', 
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>

                      {b.buttonText && b.buttonLink && (
                        <button
                          onClick={() => handleActionClick(b.buttonLink)}
                          className="flex items-center gap-1 text-[10px] font-black text-green-700 hover:text-green-800 transition-colors uppercase tracking-wider"
                        >
                          {b.buttonText}
                          <ChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            }

            // Fallback for legacy simple text notifications
            return (
              <div 
                key={b.id} 
                className="bg-white rounded-[20px] border border-slate-150 p-4 flex gap-3 shadow-xs hover:border-slate-250 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 text-green-600">
                  <Megaphone size={16} />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-xs text-slate-700 leading-relaxed">{b.message}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    {new Date(b.created_at).toLocaleDateString('gu-IN', { 
                      day: 'numeric', 
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
