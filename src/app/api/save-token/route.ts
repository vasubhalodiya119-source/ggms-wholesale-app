import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    const { shop_id, admin_id, is_admin, endpoint, p256dh, auth } = await req.json()

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 })
    }

    let result;
    if (is_admin || admin_id) {
      result = await supabase.from('admin_push_subscriptions').upsert(
        {
          admin_id: admin_id || null,
          endpoint: endpoint,
          p256dh: p256dh || 'fcm',
          auth: auth || 'fcm',
        },
        { onConflict: 'endpoint' }
      )
      // Ensure admin token is removed from customer push_subscriptions
      await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
    } else {
      result = await supabase.from('push_subscriptions').upsert(
        {
          shop_id: shop_id || null,
          endpoint: endpoint,
          p256dh: p256dh || 'fcm',
          auth: auth || 'fcm',
        },
        { onConflict: 'endpoint' }
      )
    }

    const { data, error } = result

    if (error) {
      console.error('Error saving token in database API:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error in save-token API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
