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
let isFirebaseInitialized = false

function initFirebase() {
  if (isFirebaseInitialized) return true

  try {
    const { getApps, initializeApp, cert } = require('firebase-admin/app')
    if (!getApps().length) {
      const envJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      let serviceAccount: any

      if (envJson) {
        serviceAccount = JSON.parse(envJson)
      } else {
        try {
          const fs = require('fs')
          const path = require('path')
          const filePath = path.join(process.cwd(), 'firebase-service-account.json')
          if (fs.existsSync(filePath)) {
            serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'))
          } else {
            console.warn('firebase-service-account.json not found on disk.')
            return false
          }
        } catch (fileErr) {
          console.error('Error reading firebase-service-account.json file:', fileErr)
          return false
        }
      }

      initializeApp({
        credential: cert(serviceAccount)
      })
    }
    isFirebaseInitialized = true
    return true
  } catch (e) {
    console.error('Failed to initialize firebase-admin:', e)
    return false
  }
}

export async function POST(req: Request) {
  try {
    initWebPush()
    const payload = await req.json()
    
    // Normalize fields (supports both custom broadcast and system triggerPush format)
    let type = payload.type || 'system_alert'
    let title = payload.title
    let message = payload.message || payload.body
    let image = payload.image
    let buttonText = payload.buttonText
    let buttonLink = payload.buttonLink || payload.url
    let target_type = payload.target_type
    let selected_customer_ids = payload.selected_customer_ids
    let segment_type = payload.segment_type

    // If target_type is not provided, try to infer it from other properties
    if (!target_type) {
      if (payload.shop_id) {
        target_type = 'selected'
        selected_customer_ids = [payload.shop_id]
      } else {
        target_type = 'all'
      }
    }

    if (!type || !title || !message || !target_type) {
      return NextResponse.json({ error: 'type, title, message, and target_type are required' }, { status: 400 })
    }

    let targetTokens = []
    let targetValueDescription = 'All Customers'

    // 1. Filter Subscriptions based on Target Type
    if (target_type === 'all') {
      targetValueDescription = 'All Customers'
      const { data: subs, error } = await supabase.from('push_subscriptions').select('*')
      if (error) throw error
      targetTokens = subs || []
    } else if (target_type === 'admin') {
      targetValueDescription = 'All Admins'
      const { data: subs, error } = await supabase.from('admin_push_subscriptions').select('*')
      if (error) throw error
      targetTokens = subs || []
    } else if (target_type === 'selected') {
      if (!Array.isArray(selected_customer_ids) || selected_customer_ids.length === 0) {
        return NextResponse.json({ error: "selected_customer_ids must be a non-empty array for target_type 'selected'" }, { status: 400 })
      }
      targetValueDescription = `${selected_customer_ids.length} Selected Customer(s)`
      const { data: subs, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .in('shop_id', selected_customer_ids)
      if (error) throw error
      targetTokens = subs || []
    } else if (target_type === 'segment') {
      if (!segment_type) {
        return NextResponse.json({ error: "segment_type is required for target_type 'segment'" }, { status: 400 })
      }

      // Fetch all shops and orders to evaluate segment rules
      const { data: allShops, error: shopErr } = await supabase.from('shops').select('*')
      const { data: allOrders, error: orderErr } = await supabase.from('orders').select('*')
      
      if (shopErr) throw shopErr
      if (orderErr) throw orderErr

      const now = Date.now()
      let filteredShops = []

      if (segment_type === 'new') {
        targetValueDescription = 'New Customers (Registered <= 7 days)'
        filteredShops = (allShops || []).filter((s) => {
          if (!s.created_at) return false
          const diffDays = (now - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24)
          return diffDays <= 7
        })
      } else if (segment_type === 'regular') {
        targetValueDescription = 'Regular Customers (> 3 orders)'
        filteredShops = (allShops || []).filter((s) => {
          const count = (allOrders || []).filter((o) => o.shop_id === s.id).length
          return count > 3
        })
      } else if (segment_type === 'inactive') {
        targetValueDescription = 'Inactive Customers (No order or > 15 days ago)'
        filteredShops = (allShops || []).filter((s) => {
          const shopOrders = (allOrders || []).filter((o) => o.shop_id === s.id)
          if (shopOrders.length === 0) {
            if (!s.created_at) return true
            const diffDays = (now - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24)
            return diffDays > 15
          }
          shopOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          const latestOrder = shopOrders[0]
          const diffDays = (now - new Date(latestOrder.created_at).getTime()) / (1000 * 60 * 60 * 24)
          return diffDays > 15
        })
      } else if (segment_type === 'high_value') {
        targetValueDescription = 'High Value Customers (Spent > ₹1500)'
        filteredShops = (allShops || []).filter((s) => {
          const totalSpent = (allOrders || [])
            .filter((o) => o.shop_id === s.id)
            .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
          return totalSpent > 1500
        })
      } else {
        return NextResponse.json({ error: `Unknown segment_type: ${segment_type}` }, { status: 400 })
      }

      const shopIds = filteredShops.map((s) => s.id)
      if (shopIds.length > 0) {
        const { data: subs, error: subErr } = await supabase
          .from('push_subscriptions')
          .select('*')
          .in('shop_id', shopIds)
        if (subErr) throw subErr
        targetTokens = subs || []
      }
    } else {
      return NextResponse.json({ error: `Unknown target_type: ${target_type}` }, { status: 400 })
    }

    if (targetTokens.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No registered device tokens found for target',
        stats: { totalAttempted: 0, succeeded: 0, failed: 0 }
      })
    }

    // 2. Dispatch Notifications
    let successCount = 0
    let failCount = 0

    const sendPromises = targetTokens.map(async (sub) => {
      if (sub.auth === 'fcm') {
        // Native Push via Firebase FCM
        const ready = initFirebase()
        if (!ready) {
          console.error('Firebase admin not initialized, skipping FCM push.')
          failCount++
          return
        }

        try {
          const { getMessaging } = require('firebase-admin/messaging')
          const fcmPayload: any = {
            token: sub.endpoint,
            notification: {
              title: title,
              body: message,
            },
            data: {
              url: buttonLink || '/'
            },
            android: {
              priority: 'high',
              notification: {
                sound: 'default',
                priority: 'high',
                channelId: 'ggms_notifications'
              }
            }
          }

          if (image) {
            fcmPayload.notification.image = image
            fcmPayload.android.notification.image = image
            fcmPayload.data.image = image
          }
          if (buttonText && buttonLink) {
            fcmPayload.data.buttonText = buttonText
            fcmPayload.data.buttonLink = buttonLink
          }

          await getMessaging().send(fcmPayload)
          successCount++
        } catch (e: any) {
          console.error('Error sending FCM push:', e?.message || e)
          failCount++
          if (e.code === 'messaging/invalid-registration-token' || e.code === 'messaging/registration-token-not-registered') {
            const table = sub.admin_id ? 'admin_push_subscriptions' : 'push_subscriptions'
            await supabase.from(table).delete().eq('endpoint', sub.endpoint)
          }
        }
      } else {
        // Standard Web Push
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }

        const webPushPayload = JSON.stringify({
          title,
          body: message,
          url: buttonLink || '/',
          image: image || '',
          buttonText: buttonText || '',
          buttonLink: buttonLink || '',
          type
        })

        try {
          await webpush.sendNotification(pushSubscription, webPushPayload)
          successCount++
        } catch (e: any) {
          if (e.statusCode === 410 || e.statusCode === 404) {
            const table = sub.admin_id ? 'admin_push_subscriptions' : 'push_subscriptions'
            await supabase.from(table).delete().eq('endpoint', sub.endpoint)
          } else {
            console.error('Error sending Web push:', e?.message || e)
          }
          failCount++
        }
      }
    })

    await Promise.all(sendPromises)

    // 3. Store Broadcast History Log as JSON inside the message column
    const broadcastPayload = JSON.stringify({
      type,
      title,
      message,
      image: image || '',
      buttonText: buttonText || '',
      buttonLink: buttonLink || '',
      target_type,
      target_value: targetValueDescription,
      sent_count: successCount,
      created_at: new Date().toISOString()
    })

    await supabase.from('broadcasts').insert({
      message: broadcastPayload
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalAttempted: targetTokens.length,
        succeeded: successCount,
        failed: failCount
      }
    })
  } catch (error) {
    const e = error as Error
    console.error('Error in send-push API:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
