import { supabase } from './supabase'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'

export function getPushLogs(): Array<{ time: string; message: string; isError: boolean }> {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('ggms_push_logs') || '[]')
  } catch {
    return []
  }
}

export function clearPushLogs() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('ggms_push_logs')
  window.dispatchEvent(new Event('ggms_push_logs_changed'))
}

function logPushEvent(message: string, isError = false) {
  if (typeof window === 'undefined') return
  try {
    const logs = JSON.parse(localStorage.getItem('ggms_push_logs') || '[]')
    logs.push({
      time: new Date().toISOString(),
      message,
      isError
    })
    localStorage.setItem('ggms_push_logs', JSON.stringify(logs.slice(-15)))
    window.dispatchEvent(new Event('ggms_push_logs_changed'))
  } catch (e) {
    console.error('Failed to log push event', e)
  }
}

export async function getPushPermissionStatus(): Promise<'granted' | 'denied' | 'prompt'> {
  if (typeof window === 'undefined') return 'denied';

  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await PushNotifications.checkPermissions();
      return perm.receive === 'prompt-with-rationale' ? 'prompt' : perm.receive;
    } catch (e) {
      logPushEvent('Error checking push permissions: ' + (e instanceof Error ? e.message : String(e)), true)
      return 'denied';
    }
  } else {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'default') return 'prompt';
    return Notification.permission as 'granted' | 'denied';
  }
}

// Guard against multiple concurrent subscribe calls
let isSubscribing = false
let hasSubscribed = false

export async function subscribeToPush(shopId: string | null) {
  if (typeof window === 'undefined') return

  // Prevent double-calls in the same session
  if (isSubscribing || hasSubscribed) {
    logPushEvent(`Subscription skipped. isSubscribing: ${isSubscribing}, hasSubscribed: ${hasSubscribed}`)
    return
  }
  isSubscribing = true
  logPushEvent(`Starting subscribeToPush for shop: ${shopId}`)

  try {
    if (Capacitor.isNativePlatform()) {
      logPushEvent('Native platform detected')
      let permStatus = await PushNotifications.checkPermissions();
      logPushEvent(`Initial permission status: ${permStatus.receive}`)
      if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
        logPushEvent('Requesting push permissions...')
        permStatus = await PushNotifications.requestPermissions();
        logPushEvent(`Permission request result: ${permStatus.receive}`)
      }
      if (permStatus.receive !== 'granted') {
        logPushEvent('User denied push permission', true);
        return;
      }

      logPushEvent('Removing previous push listeners...')
      await PushNotifications.removeAllListeners();

      logPushEvent('Registering push listeners...')
      await PushNotifications.addListener('registration', async (token) => {
        logPushEvent(`Push registration success. Token prefix: ${token.value.substring(0, 10)}...`);
        // Save FCM token to database
        const { error: dbErr } = await supabase.from('push_subscriptions').upsert(
          {
            shop_id: shopId,
            endpoint: token.value, // Treat FCM token as endpoint
            p256dh: null,
            auth: 'fcm', // Special flag to identify FCM tokens
          },
          { onConflict: 'endpoint' }
        )
        if (dbErr) {
          logPushEvent(`Failed to save token to database: ${dbErr.message}`, true)
        } else {
          logPushEvent('FCM token saved to database successfully.')
          hasSubscribed = true
        }
      });

      await PushNotifications.addListener('registrationError', (error: any) => {
        logPushEvent(`Error on registration: ${JSON.stringify(error)}`, true);
      });

      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        logPushEvent(`Push notification received: ${notification.title}`);
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        logPushEvent(`Push notification action performed: ${notification.actionId}`);
      });

      logPushEvent('Registering with Apple/Google push service...')
      await PushNotifications.register();
      logPushEvent('PushNotifications.register() called.')

    } else {
      logPushEvent('Web platform detected')
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        logPushEvent('ServiceWorker or PushManager not supported', true)
        return
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        logPushEvent('VAPID public key not set', true)
        return
      }

      try {
        logPushEvent('Requesting notification permission...')
        const permission = await Notification.requestPermission()
        logPushEvent(`Notification permission result: ${permission}`)
        if (permission !== 'granted') return

        const registration = await navigator.serviceWorker.ready
        logPushEvent('Service worker ready. Getting push subscription...')
        let subscription = await registration.pushManager.getSubscription()

        if (subscription) {
          logPushEvent('Found existing subscription')
          const currentKey = subscription.options?.applicationServerKey
          const expectedKey = urlBase64ToUint8Array(vapidPublicKey)
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
            logPushEvent('VAPID key mismatch, unsubscribing...')
            await subscription.unsubscribe()
            subscription = null
          }
        }

        if (!subscription) {
          logPushEvent('Creating new push subscription...')
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          })
          logPushEvent('Subscription created successfully')
        }

        const subJson = subscription.toJSON()
        if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
          logPushEvent('Invalid subscription JSON format', true)
          return
        }

        logPushEvent('Saving web subscription to database...')
        const { error: dbErr } = await supabase.from('push_subscriptions').upsert(
          {
            shop_id: shopId,
            endpoint: subJson.endpoint,
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth,
          },
          { onConflict: 'endpoint' }
        )
        
        if (dbErr) {
          logPushEvent(`Failed to save web subscription to database: ${dbErr.message}`, true)
        } else {
          logPushEvent('Web subscription saved to database successfully.')
          hasSubscribed = true
        }
      } catch (err: any) {
        logPushEvent(`Push subscribe failed: ${err?.message || String(err)}`, true)
      }
    }
  } catch (err: any) {
    logPushEvent(`Subscribe general error: ${err?.message || String(err)}`, true)
  } finally {
    isSubscribing = false
  }
}

export async function triggerPush(payload: { title: string; body: string; url?: string; shop_id?: string }) {
  try {
    await fetch('/api/send-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error('Push trigger failed', err)
  }
}
