'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Megaphone } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Broadcast } from '@/lib/types'

export default function NotificationsPage() {
  const router = useRouter()
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])

  useEffect(() => {
    supabase
      .from('broadcasts')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setBroadcasts((data as Broadcast[]) || []))
  }, [])

  return (
    <div className="px-4 pt-3 pb-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-extrabold text-slate-900">Notifications</h1>
      </div>

      {broadcasts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center text-center">
          <Megaphone size={28} className="text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">હજુ સુધી કોઈ notification નથી</p>
        </div>
      ) : (
        <div className="space-y-3">
          {broadcasts.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Megaphone size={16} className="text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-slate-700">{b.message}</p>
                <p className="text-[11px] text-slate-400 mt-1">{new Date(b.created_at).toLocaleString('en-IN')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
