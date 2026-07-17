'use client'

import { useState, useEffect } from 'react'
import { getPushPermissionStatus, subscribeToPush } from '@/lib/push'
import { useShopAuth } from '@/lib/shop-auth'

export default function PushDebug() {
  const [status, setStatus] = useState<string>('loading...')
  const [log, setLog] = useState<string>('')
  const { shop } = useShopAuth()

  const check = async () => {
    try {
      const s = await getPushPermissionStatus()
      setStatus(s)
    } catch (e: any) {
      setStatus('crash: ' + e.message)
    }
  }

  useEffect(() => {
    check()
  }, [])

  return (
    <div className="p-4 bg-red-100 text-red-900 m-4 rounded-xl border border-red-300 shadow-lg relative z-50">
      <h3 className="font-bold text-lg mb-2">Push Debug Info (Only for testing)</h3>
      <p className="font-mono text-sm break-all">Status: {status}</p>
      <p className="font-mono text-sm">Shop ID: {shop?.id || 'Not logged in'}</p>
      
      {log && <p className="font-mono text-xs mt-2 bg-white p-2 rounded">{log}</p>}

      <div className="flex flex-wrap gap-2 mt-4">
        <button 
          onClick={async () => {
            setLog('Requesting push...')
            try {
              await subscribeToPush(shop?.id || null)
              setLog('Subscribe call finished.')
              await check()
            } catch (e: any) {
              setLog('error: ' + e.message)
              await check()
            }
          }}
          className="bg-red-600 text-white px-4 py-2 rounded font-semibold text-sm"
        >
          Force Subscribe
        </button>
        
        <button 
          onClick={async () => {
            localStorage.removeItem('ggms_push_declined')
            setLog('cleared ggms_push_declined')
          }} 
          className="bg-blue-600 text-white px-4 py-2 rounded font-semibold text-sm"
        >
          Clear Declination
        </button>

        <button 
          onClick={check} 
          className="bg-green-600 text-white px-4 py-2 rounded font-semibold text-sm"
        >
          Refresh Status
        </button>
      </div>
    </div>
  )
}
