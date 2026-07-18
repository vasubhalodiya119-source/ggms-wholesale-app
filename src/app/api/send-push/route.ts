import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Configure web-push lazily
let isWebPushInitialized = false
function initWebPush() {
  if (isWebPushInitialized) return

  const subject = process.env.VAPID_SUBJECT || 'mailto:support@example.com'
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY

  if (!publicKey || !privateKey) {
    console.warn('VAPID keys not set. Web Push will not work.')
    return
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey)
    isWebPushInitialized = true
  } catch (e) {
    console.error('Failed to set VAPID details:', e)
  }
}

// Lazy-init firebase-admin from environment variable
let firebaseAdmin: any = null

function getFirebaseAdmin() {
  if (firebaseAdmin) return firebaseAdmin

  try {
    const admin = require('firebase-admin')
    if (!admin.apps.length) {
      // Try env var first (for Vercel / production), then fall back to local file
      const envJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      let serviceAccount: any

      if (envJson) {
        serviceAccount = JSON.parse(envJson)
      } else {
        // Fallback: try loading from file dynamically (local development)
        try {
          const fs = require('fs')
          const path = require('path')
          const filePath = path.join(process.cwd(), 'firebase-service-account.json')
          if (fs.existsSync(filePath)) {
            serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'))
          } else {
            console.warn('firebase-service-account.json not found on disk.')
            return null
          }
        } catch (fileErr) {
          console.error('Error reading firebase-service-account.json file:', fileErr)
          return null
        }
      }

      const { cert } = require('firebase-admin/app')
      admin.initializeApp({
        credential: cert(serviceAccount)
      })
    }
    firebaseAdmin = admin
    return admin
  } catch (e) {
    console.error('Failed to initialize firebase-admin:', e)
    return null
  }
}

export async function POST(req: Request) {
  try {
    initWebPush()
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

    let successCount = 0
    let failCount = 0

    const sendPromises = subscriptions.map(async (sub) => {
      if (sub.auth === 'fcm') {
        // Native Push via FCM
        const admin = getFirebaseAdmin()
        if (!admin) {
          console.error('Firebase admin not initialized, skipping FCM push to:', sub.endpoint?.substring(0, 20))
          failCount++
          return
        }

        try {
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
          })
          console.log('FCM push sent successfully to', sub.endpoint?.substring(0, 20) + '...')
          successCount++
        } catch (e: any) {
          console.error('Error sending FCM push:', e?.message || e)
          failCount++
          if (e.code === 'messaging/invalid-registration-token' || e.code === 'messaging/registration-token-not-registered') {
            console.log('FCM token invalid, deleting...', sub.endpoint?.substring(0, 20))
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
        return webpush.sendNotification(pushSubscription, notificationPayload).then(() => {
          successCount++
        }).catch(async (e) => {
          // If subscription is invalid/expired, remove it
          if (e.statusCode === 410 || e.statusCode === 404) {
            console.log('WebPush subscription expired or invalid, deleting...', sub.endpoint?.substring(0, 20))
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          } else {
            console.error('Error sending Web push:', e?.message || e)
          }
          failCount++
        })
      }
    })

    await Promise.all(sendPromises)

    return NextResponse.json({ 
      success: true, 
      total: subscriptions.length,
      sent: successCount,
      failed: failCount
    })
  } catch (error) {
    const e = error as Error
    console.error('Error in send-push API:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

