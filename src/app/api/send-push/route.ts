import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Configure web-push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:support@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const { title, body, url, shop_id } = payload

    // Build the query
    let query = supabase.from('push_subscriptions').select('*')
    if (shop_id) {
      query = query.eq('shop_id', shop_id)
    }

    const { data: subscriptions, error } = await query

    if (error) {
      throw error
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'No subscriptions found' }, { status: 200 })
    }

    const notificationPayload = JSON.stringify({
      title: title || 'Notification',
      body: body || '',
      url: url || '/',
    })

    const sendPromises = subscriptions.map(async (sub) => {
      if (sub.auth === 'fcm') {
        // Native Push via FCM
        try {
          // Dynamic import to avoid client-side bundling issues if any
          const admin = require('firebase-admin');
          if (!admin.apps.length) {
            const serviceAccount = require('../../../../firebase-service-account.json');
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount)
            });
          }

          await admin.messaging().send({
            token: sub.endpoint, // We stored FCM token in endpoint
            notification: {
              title: title || 'Notification',
              body: body || ''
            },
            data: {
              url: url || '/'
            },
            android: {
              notification: {
                sound: 'default'
              }
            }
          });
          console.log('FCM push sent successfully to', sub.endpoint);
        } catch (e: any) {
          console.error('Error sending FCM push:', e);
          if (e.code === 'messaging/invalid-registration-token' || e.code === 'messaging/registration-token-not-registered') {
            console.log('FCM token invalid, deleting...', sub.endpoint)
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          }
        }
      } else {
        // Web Push
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }
        return webpush.sendNotification(pushSubscription, notificationPayload).catch(async (e) => {
          // If subscription is invalid/expired, remove it
          if (e.statusCode === 410 || e.statusCode === 404) {
            console.log('WebPush subscription expired or invalid, deleting...', sub.endpoint)
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          } else {
            console.error('Error sending Web push:', e)
          }
        })
      }
    })

    await Promise.all(sendPromises)

    return NextResponse.json({ success: true, count: subscriptions.length })
  } catch (error) {
    const e = error as Error
    console.error('Error in send-push API:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
