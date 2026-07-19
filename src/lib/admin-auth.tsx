'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from './supabase'
import { Admin } from './types'

type AdminAuthContextType = {
  admin: Admin | null
  loading: boolean
  login: (phone: string, password: string) => Promise<{ error: string | null }>
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)
const STORAGE_KEY = 'ggms_admin_session'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'

async function subscribeAdminToPush(adminId: string) {
  if (typeof window === 'undefined') return

  if (Capacitor.isNativePlatform()) {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== 'granted') return;

    await PushNotifications.removeAllListeners();

    PushNotifications.addListener('registration', async (token) => {
      try {
        const res = await fetch('/api/save-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            admin_id: adminId,
            is_admin: true,
            endpoint: token.value,
            p256dh: 'fcm',
            auth: 'fcm',
          }),
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errData.error || `HTTP error ${res.status}`)
        }
      } catch (err: any) {
        console.error('Failed to save admin push token:', err.message || err)
      }
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on admin push registration:', error);
    });

    await PushNotifications.register();
  } else {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) return
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return
      const reg = await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()
      if (sub) {
        const currentKey = sub.options?.applicationServerKey
        const expectedKey = urlBase64ToUint8Array(vapidKey)
        let match = true
        if (currentKey && expectedKey) {
          const currentArray = new Uint8Array(currentKey)
          if (currentArray.length !== expectedKey.length) {
            match = false
          } else {
            for (let i = 0; i < currentArray.length; i++) {
              if (currentArray[i] !== expectedKey[i]) {
                match = false
                break
              }
            }
          }
        } else {
          match = false
        }
        if (!match) {
          await sub.unsubscribe()
          sub = null
        }
      }
      
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })
      }
      const subJson = sub.toJSON()
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) return
      
      const res = await fetch('/api/save-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_id: adminId,
          is_admin: true,
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errData.error || `HTTP error ${res.status}`)
      }
    } catch (err) {
      console.error('Admin push subscribe failed', err)
    }
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY)
    if (savedId) {
      supabase.from('admins').select('*').eq('id', savedId).single().then(({ data }) => {
        if (data) {
          setAdmin(data as Admin)
          subscribeAdminToPush(data.id)
        }
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [])

  async function login(phone: string, password: string) {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('phone', phone.trim())
      .eq('password', password)
      .maybeSingle()

    if (error) return { error: 'કંઈક ભૂલ થઈ' }
    if (!data) return { error: 'ફોન નંબર અથવા પાસવર્ડ ખોટો છે' }

    setAdmin(data as Admin)
    localStorage.setItem(STORAGE_KEY, data.id)
    subscribeAdminToPush(data.id)
    return { error: null }
  }

  function logout() {
    setAdmin(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
