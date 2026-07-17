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

export async function subscribeToPush(shopId: string | null) {
  if (typeof window === 'undefined') return

  if (Capacitor.isNativePlatform()) {
    // ----------------------------
    // NATIVE (ANDROID/IOS) PUSH
    // ----------------------------
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== 'granted') {
      console.warn('User denied push permission');
      return;
    }

    // Register with Apple / Google to receive push via APNS/FCM
    await PushNotifications.register();

    // On success, we get an FCM token
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token: ' + token.value);
      // Save FCM token to database
      await supabase.from('push_subscriptions').upsert(
        {
          shop_id: shopId,
          endpoint: token.value, // Treat FCM token as endpoint
          p256dh: null,
          auth: 'fcm', // Special flag to identify FCM tokens
        },
        { onConflict: 'endpoint' }
      )
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ', notification);
    });

  } else {
    // ----------------------------
    // WEB PUSH (BROWSER)
    // ----------------------------
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidPublicKey) return

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()

      if (subscription) {
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
          await subscription.unsubscribe()
          subscription = null
        }
      }

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        })
      }

      const subJson = subscription.toJSON()
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) return

      await supabase.from('push_subscriptions').upsert(
        {
          shop_id: shopId,
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
        { onConflict: 'endpoint' }
      )
    } catch (err) {
      console.error('Push subscribe failed', err)
    }
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
