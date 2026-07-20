'use client'

import { useEffect, useRef } from 'react'
import { useShopAuth } from '@/lib/shop-auth'
import { subscribeToPush, getPushPermissionStatus } from '@/lib/push'

export default function NotificationPrompt() {
  const { shop } = useShopAuth()
  const attempted = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!shop || attempted.current) return

    const checkAndSubscribe = async () => {
      attempted.current = true
      try {
        const status = await getPushPermissionStatus()
        // If it's prompt, we ask natively
        if (status !== 'granted') {
          // Add a small delay so it doesn't pop up the split second they open the app
          setTimeout(() => {
            subscribeToPush(shop.id).catch(console.error)
          }, 1000)
        }
      } catch (e) {
        console.error('Error auto-subscribing:', e)
      }
    }
    
    checkAndSubscribe()
  }, [shop])

  return null
}
