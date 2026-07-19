'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  Package, 
  AlertTriangle, 
  Check, 
  Send, 
  Megaphone, 
  Loader2, 
  Tag, 
  Trash2, 
  Smartphone, 
  Search, 
  Clock, 
  Users 
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type LowStockAlert = {
  id: string
  product_id: string
  stock_at_alert: number
  is_resolved: boolean
  created_at: string
  products: { name: string } | null
}

type CreditAlert = {
  id: string
  shop_id: string
  balance_at_alert: number
  credit_limit_at_alert: number
  is_resolved: boolean
  created_at: string
  shops: { shop_name: string } | null
}

type Shop = {
  id: string
  shop_name: string
  owner_name: string | null
  phone: string
  email?: string
  created_at: string
}

type ProductShort = {
  id: string
  name: string
}

type OrderShort = {
  id: string
  shop_id: string | null
  total_amount: number
  created_at: string
}

type RichBroadcast = {
  id: string
  message: string // stored JSON or raw text
  created_at: string
}

export default function NotificationCenterPage() {
  const [lowStock, setLowStock] = useState<LowStockAlert[]>([])
  const [creditAlerts, setCreditAlerts] = useState<CreditAlert[]>([])
  const [rawBroadcasts, setRawBroadcasts] = useState<RichBroadcast[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [activeSubShopIds, setActiveSubShopIds] = useState<Set<string>>(new Set())
  const [products, setProducts] = useState<ProductShort[]>([])
  const [orders, setOrders] = useState<OrderShort[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)

  // Notification Compose Form States
  const [notifType, setNotifType] = useState<string>('offer')
  const [notifTitle, setNotifTitle] = useState<string>('')
  const [notifMessage, setNotifMessage] = useState<string>('')
  const [notifImage, setNotifImage] = useState<string>('')
  const [notifButtonText, setNotifButtonText] = useState<string>('')
  const [notifButtonLink, setNotifButtonLink] = useState<string>('')
  const [notifTargetType, setNotifTargetType] = useState<string>('all')
  const [notifSegmentType, setNotifSegmentType] = useState<string>('new')
  const [notifSelectedCustomerIds, setNotifSelectedCustomerIds] = useState<string[]>([])
  const [notifSearchQuery, setNotifSearchQuery] = useState<string>('')
  const [sending, setSending] = useState(false)

  // Fetch all necessary data
  async function load() {
    setLoadingLogs(true)
    
    // Low stock
    const { data: ls } = await supabase
      .from('low_stock_alerts')
      .select('*, products(name)')
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
    setLowStock((ls as any) || [])

    // Credit limit
    const { data: ca } = await supabase
      .from('credit_alerts')
      .select('*, shops(shop_name)')
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
    setCreditAlerts((ca as any) || [])

    // Broadcasts
    const { data: bc } = await supabase
      .from('broadcasts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)
    setRawBroadcasts((bc as RichBroadcast[]) || [])

    // Shops
    const { data: sh } = await supabase
      .from('shops')
      .select('id, shop_name, owner_name, phone, created_at')
      .order('shop_name')
    setShops((sh as Shop[]) || [])

    // Subscriptions to identify registered devices
    const { data: su } = await supabase
      .from('push_subscriptions')
      .select('shop_id')
    const subs = su || []
    setActiveSubShopIds(new Set(subs.map(s => s.shop_id).filter(Boolean) as string[]))

    // Products
    const { data: pr } = await supabase
      .from('products')
      .select('id, name')
      .order('name')
    setProducts((pr as ProductShort[]) || [])

    // Orders for segment calculation
    const { data: ord } = await supabase
      .from('orders')
      .select('id, shop_id, total_amount, created_at')
    setOrders((ord as OrderShort[]) || [])

    setLoadingLogs(false)
  }

  useEffect(() => {
    load()
  }, [])

  // Parse rich message details on the fly
  const notificationsLog = useMemo(() => {
    return rawBroadcasts.map(b => {
      let isRich = false
      let details: any = {}
      try {
        if (b.message.trim().startsWith('{')) {
          details = JSON.parse(b.message)
          isRich = true
        }
      } catch (e) {
        isRich = false
      }

      return {
        id: b.id,
        created_at: b.created_at,
        isRich,
        type: details.type || 'info',
        title: details.title || 'Broadcast Announcement',
        message: isRich ? details.message : b.message,
        image: details.image || '',
        buttonText: details.buttonText || '',
        buttonLink: details.buttonLink || '',
        target_type: details.target_type || 'all',
        target_value: details.target_value || 'All Customers',
        sent_count: details.sent_count ?? 1
      }
    })
  }, [rawBroadcasts])

  // Calculate segment matching sizes in real-time
  const segmentCountInfo = useMemo(() => {
    const now = Date.now()
    const counts = { new: 0, regular: 0, inactive: 0, high_value: 0 }
    if (!shops.length) return counts

    counts.new = shops.filter(s => {
      if (!s.created_at) return false
      const diffDays = (now - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24)
      return diffDays <= 7
    }).length

    counts.regular = shops.filter(s => {
      const shopOrders = orders.filter(o => o.shop_id === s.id)
      return shopOrders.length > 3
    }).length

    counts.inactive = shops.filter(s => {
      const shopOrders = orders.filter(o => o.shop_id === s.id)
      if (shopOrders.length === 0) {
        if (!s.created_at) return true
        const diffDays = (now - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24)
        return diffDays > 15
      }
      const sorted = [...shopOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      const diffDays = (now - new Date(sorted[0].created_at).getTime()) / (1000 * 60 * 60 * 24)
      return diffDays > 15
    }).length

    counts.high_value = shops.filter(s => {
      const totalSpent = orders
        .filter(o => o.shop_id === s.id)
        .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
      return totalSpent > 1500
    }).length

    return counts
  }, [shops, orders])

  // Send payload to Next.js send-push backend endpoint
  async function handleSendNotification(e: React.FormEvent) {
    e.preventDefault()
    if (!notifTitle.trim() || !notifMessage.trim()) return

    if (notifTargetType === 'selected' && notifSelectedCustomerIds.length === 0) {
      alert('Please select at least one shopkeeper!')
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: notifType,
          title: notifTitle.trim(),
          message: notifMessage.trim(),
          image: notifImage.trim() || undefined,
          buttonText: notifButtonText.trim() || undefined,
          buttonLink: notifButtonLink.trim() || undefined,
          target_type: notifTargetType,
          selected_customer_ids: notifSelectedCustomerIds,
          segment_type: notifSegmentType
        })
      })

      const result = await response.json()
      if (response.ok && result.success) {
        // Reset form inputs
        setNotifTitle('')
        setNotifMessage('')
        setNotifImage('')
        setNotifButtonText('')
        setNotifButtonLink('')
        setNotifSelectedCustomerIds([])
        load()
      } else {
        alert(result.error || 'Failed to dispatch notifications.')
      }
    } catch (err) {
      console.error(err)
      alert('Something went wrong while sending notifications.')
    } finally {
      setSending(false)
    }
  }

  async function deleteBroadcast(id: string) {
    if (confirm('Are you sure you want to delete this notification record?')) {
      await supabase.from('broadcasts').delete().eq('id', id)
      load()
    }
  }

  async function resolveLowStock(id: string) {
    await supabase.from('low_stock_alerts').update({ is_resolved: true }).eq('id', id)
    load()
  }

  async function resolveCreditAlert(id: string) {
    await supabase.from('credit_alerts').update({ is_resolved: true }).eq('id', id)
    load()
  }

  const filteredShopsList = useMemo(() => {
    return shops.filter(s => {
      if (!notifSearchQuery.trim()) return true
      const q = notifSearchQuery.toLowerCase()
      return (
        s.shop_name.toLowerCase().includes(q) ||
        (s.owner_name || '').toLowerCase().includes(q) ||
        s.phone.includes(q)
      )
    })
  }, [shops, notifSearchQuery])

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase">Notification Center</h1>
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
          ગ્રાહકો માટે પુશ નોટિફિકેશન મેનેજમેન્ટ / Premium Push Dashboard
        </p>
      </div>

      {/* Main Two Column Composer & Preview Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Form Compose */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
              <Megaphone size={16} className="text-green-600" /> Compose New Notification
            </h3>
            <p className="text-[10px] text-slate-400 font-bold">ગ્રાહકોને પુશ નોટિફિકેશન મોકલો / Send push notifications</p>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-4">
            {/* Notification Type Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Notification Type / પ્રકાર</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['offer', 'info', 'notice', 'custom'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNotifType(type)}
                    className={`py-2 px-3 text-xs font-black rounded-xl uppercase tracking-wider border-2 transition-all cursor-pointer ${
                      notifType === type
                        ? 'border-green-600 bg-green-50/30 text-green-800'
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {type === 'offer' && '🎉 Offer'}
                    {type === 'info' && '📢 Info'}
                    {type === 'notice' && '⚠️ Notice'}
                    {type === 'custom' && '⚙️ Custom'}
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Message */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Notification Title / શીર્ષક</label>
                <input
                  type="text"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="e.g. 🎉 Special Offer Available"
                  className="w-full text-xs font-bold p-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:border-green-500 focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Image Banner URL (Optional)</label>
                <input
                  type="text"
                  value={notifImage}
                  onChange={(e) => setNotifImage(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full text-xs font-bold p-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:border-green-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Message / સંદેશ</label>
              <textarea
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                placeholder="Write your push message in Gujarati or English..."
                rows={3}
                className="w-full text-xs font-bold p-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:border-green-500 focus:outline-none resize-none"
                required
              />
            </div>

            {/* Action Button Details */}
            <div className="bg-slate-50/40 border border-slate-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Call to Action Button (Optional)</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Button Text / બટન લખાણ</label>
                  <input
                    type="text"
                    value={notifButtonText}
                    onChange={(e) => setNotifButtonText(e.target.value)}
                    placeholder="e.g. Shop Now / હમણાં ખરીદો"
                    className="w-full text-xs font-bold p-2.5 bg-white border border-slate-200 rounded-xl focus:border-green-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Button Link / બટન લિંક</label>
                  <select
                    value={notifButtonLink}
                    onChange={(e) => setNotifButtonLink(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 bg-white border border-slate-200 rounded-xl focus:border-green-500 focus:outline-none"
                  >
                    <option value="">No action (Open App Home)</option>
                    <option value="/">Home Page (/)</option>
                    <option value="/notifications">Notification Center (/notifications)</option>
                    <option value="/wishlist">Wishlist Page (/wishlist)</option>
                    <option value="/cart">Cart Page (/cart)</option>
                    <option value="/orders">Order History (/orders)</option>
                    <option value="/account">Account Settings (/account)</option>
                    <option value="/categories">Categories Overview (/categories)</option>
                    <option disabled className="font-extrabold text-slate-300">-- PRODUCTS --</option>
                    {products.map(p => (
                      <option key={p.id} value={`/orders`}>Product Link: {p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Target Audience Selector */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Target Audience / ટાર્ગેટ ઓડિયન્સ</label>
              <div className="grid grid-cols-3 gap-2">
                {['all', 'segment', 'selected'].map(target => (
                  <button
                    key={target}
                    type="button"
                    onClick={() => setNotifTargetType(target)}
                    className={`py-2.5 px-2 text-[10px] font-black rounded-xl uppercase tracking-wider border transition-all cursor-pointer ${
                      notifTargetType === target
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'bg-white border-slate-250 hover:border-slate-350 text-slate-700'
                    }`}
                  >
                    {target === 'all' && 'All Shops'}
                    {target === 'segment' && 'Segment'}
                    {target === 'selected' && 'Selected'}
                  </button>
                ))}
              </div>

              {/* Target options sub-forms */}
              {notifTargetType === 'all' && (
                <div className="p-3 bg-green-50/30 border border-green-100 rounded-xl text-xs font-bold text-green-800">
                  📢 Targets all {shops.length} registered shops ({shops.filter(s => activeSubShopIds.has(s.id)).length} with active mobile/browser notifications).
                </div>
              )}

              {notifTargetType === 'segment' && (
                <div className="space-y-2 p-4 bg-slate-50/50 border border-slate-200 rounded-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Select Segment / સેગમેન્ટ</label>
                      <select
                        value={notifSegmentType}
                        onChange={(e) => setNotifSegmentType(e.target.value)}
                        className="w-full text-xs font-bold p-2.5 bg-white border border-slate-250 rounded-xl focus:border-green-500 focus:outline-none"
                      >
                        <option value="new">New Shops (Registered &lt;= 7 days)</option>
                        <option value="regular">Regular Shops (&gt; 3 orders)</option>
                        <option value="inactive">Inactive Shops (&gt; 15 days no order)</option>
                        <option value="high_value">High Value Shops (Spent &gt; ₹1500)</option>
                      </select>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl py-3 px-5 text-center shrink-0">
                      <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Matching</span>
                      <span className="text-lg font-black text-green-600">{(segmentCountInfo as any)[notifSegmentType]} Shops</span>
                    </div>
                  </div>
                </div>
              )}

              {notifTargetType === 'selected' && (
                <div className="space-y-3 p-4 bg-slate-50/50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-600 uppercase font-extrabold">Select Shops ({notifSelectedCustomerIds.length} Selected)</span>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by name, phone..."
                        value={notifSearchQuery}
                        onChange={(e) => setNotifSearchQuery(e.target.value)}
                        className="text-[10px] font-bold pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none w-48 text-slate-800"
                      />
                      <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 bg-white no-scrollbar">
                    {filteredShopsList.map(s => {
                      const isChecked = notifSelectedCustomerIds.includes(s.id)
                      const hasDevice = activeSubShopIds.has(s.id)
                      return (
                        <label key={s.id} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 cursor-pointer select-none text-xs text-slate-800">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setNotifSelectedCustomerIds(prev => prev.filter(id => id !== s.id))
                              } else {
                                setNotifSelectedCustomerIds(prev => [...prev, s.id])
                              }
                            }}
                            className="rounded text-green-600 focus:ring-green-500 w-4 h-4 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                              {s.shop_name}
                              {!hasDevice && <span className="text-[8px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-black">No device token</span>}
                            </div>
                            <div className="text-[9px] text-slate-400 font-bold flex gap-3">
                              <span>📞 {s.phone}</span>
                              {s.owner_name && <span>👤 {s.owner_name}</span>}
                            </div>
                          </div>
                        </label>
                      )
                    })}
                    {filteredShopsList.length === 0 && (
                      <p className="p-4 text-center text-xs italic text-slate-400">No matching shops found.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Submit Button */}
            <button
              type="submit"
              disabled={sending || !notifTitle.trim() || !notifMessage.trim()}
              className="w-full mt-2 py-3.5 bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending Notifications...
                </>
              ) : (
                <>
                  <Send size={15} /> Send Push Notification
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Live Phone Screen Preview */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-[24px] shadow-sm mb-4">
            <h4 className="font-black text-slate-200 text-xs uppercase tracking-widest text-center mb-4 flex items-center justify-center gap-2">
              <Smartphone size={14} className="text-green-500" /> Live Push Preview
            </h4>

            {/* Smartphone shell mockup */}
            <div className="w-60 mx-auto border-8 border-slate-700 bg-slate-800 rounded-[32px] overflow-hidden aspect-[9/18] shadow-2xl relative">
              {/* Speaker notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 rounded-full z-20 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              </div>

              {/* Screen */}
              <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-950 p-3 pt-8 flex flex-col justify-start relative text-white">
                <div className="absolute top-8 left-0 right-0 px-3 flex justify-between text-[8px] font-black text-slate-400 select-none">
                  <span>GGM&S Mobile</span>
                  <span>05:30 PM</span>
                </div>

                {/* Dynamic push banner */}
                <div className="w-full bg-slate-950/90 border border-slate-700/60 rounded-2xl p-3 mt-4 shadow-xl space-y-2 text-slate-100 select-none transform transition-all">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center font-extrabold text-[8px] text-white">G</div>
                      <span className="text-[9px] font-black tracking-wide text-slate-200">GGM&S Wholesale</span>
                    </div>
                    <span className="text-[8px] text-slate-500 font-bold">now</span>
                  </div>

                  <div className="space-y-1">
                    <h5 className="text-[10px] font-black leading-tight text-white">{notifTitle || '🎁 Weekend Special Rate drop'}</h5>
                    <p className="text-[9px] font-semibold text-slate-400 leading-normal line-clamp-3 whitespace-pre-wrap">
                      {notifMessage || 'નવો બજાર ભાવ અપડેટ થઈ ગયો છે, હમણાં જ નવો ભાવ જુઓ.'}
                    </p>
                  </div>

                  {notifImage && (
                    <div className="w-full h-24 rounded-lg overflow-hidden bg-slate-800">
                      <img src={notifImage} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {notifButtonText && (
                    <div className="pt-1 flex justify-end">
                      <div className="bg-slate-800 hover:bg-slate-750 text-white rounded-lg px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-center max-w-[120px] truncate shadow-xs">
                        {notifButtonText}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast History Log Section */}
      <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-black text-slate-900 text-sm sm:text-base">Broadcast History & Analytics</h3>
            <p className="text-[10px] text-slate-400 font-bold">મોકલેલા પુશ નોટિફિકેશનનો લોગ / Push notification dispatch logs</p>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">
            {notificationsLog.length} total sent
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th className="p-4 pl-5">Date & Time</th>
                <th className="p-4">Type</th>
                <th className="p-4">Title & Message</th>
                <th className="p-4">Target Audience</th>
                <th className="p-4 text-center">Delivered</th>
                <th className="p-4 pr-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {loadingLogs ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-green-600" />
                    Loading history logs...
                  </td>
                </tr>
              ) : notificationsLog.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center italic text-slate-400">No push notification records found.</td>
                </tr>
              ) : (
                notificationsLog.map(n => (
                  <tr key={n.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-5 text-slate-400 font-semibold leading-tight min-w-[110px]">
                      {new Date(n.created_at).toLocaleString('gu-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                        n.type === 'offer' ? 'bg-green-50 text-green-800 border border-green-100' :
                        n.type === 'info' ? 'bg-blue-50 text-blue-800 border border-blue-100' :
                        n.type === 'notice' ? 'bg-amber-50 text-amber-800 border border-amber-100' :
                        'bg-slate-50 text-slate-800 border border-slate-200'
                      }`}>
                        {n.type}
                      </span>
                    </td>
                    <td className="p-4 max-w-[280px]">
                      <div className="space-y-1">
                        <div className="font-extrabold text-slate-850 truncate">{n.title}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed whitespace-pre-line">{n.message}</div>
                        {n.buttonText && (
                          <div className="text-[8px] bg-slate-50 text-slate-500 font-black inline-block px-1.5 py-0.5 rounded border border-slate-150">
                            🔘 {n.buttonText} → {n.buttonLink}
                          </div>
                        )}
                        {n.image && (
                          <div className="text-[8px] text-green-600 font-black block">
                            🖼️ Image attachment included
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 font-semibold leading-tight">
                      <span className="bg-slate-50 border border-slate-150 rounded px-2 py-0.5 font-mono text-[9px] uppercase">
                        {n.target_value || n.target_type}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-extrabold text-green-700 bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-full text-[10px]">
                        {n.sent_count} sent
                      </span>
                    </td>
                    <td className="p-4 pr-5 text-right">
                      <button
                        onClick={() => deleteBroadcast(n.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg active:scale-90 transition-all cursor-pointer inline-block"
                        title="Delete Log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Backoffice System Alerts below the push dashboard */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div>
          <h2 className="font-black text-slate-800 mb-2.5 flex items-center gap-2 text-sm uppercase">
            <Package size={16} className="text-red-500" /> Low Stock Alerts ({lowStock.length})
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
            {lowStock.map((alert) => (
              <div key={alert.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-slate-800 text-sm">{alert.products?.name || 'Unknown'}</p>
                  <p className="text-xs text-red-500 font-bold">Stock left: {alert.stock_at_alert}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{new Date(alert.created_at).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/admin/inventory" className="text-xs font-black text-green-600 hover:underline">
                    Restock
                  </Link>
                  <button onClick={() => resolveLowStock(alert.id)} className="text-green-600 hover:bg-green-50 p-1.5 rounded-full">
                    <Check size={14} />
                  </button>
                </div>
              </div>
            ))}
            {lowStock.length === 0 && <p className="p-4 text-xs font-bold text-slate-400 text-center">કોઈ low stock alert નથી</p>}
          </div>
        </div>

        {/* Credit Limit Alerts */}
        <div>
          <h2 className="font-black text-slate-800 mb-2.5 flex items-center gap-2 text-sm uppercase">
            <AlertTriangle size={16} className="text-amber-500" /> Credit Limit Alerts ({creditAlerts.length})
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
            {creditAlerts.map((alert) => (
              <div key={alert.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-slate-800 text-sm">{alert.shops?.shop_name || 'Unknown'}</p>
                  <p className="text-xs text-amber-600 font-bold">
                    Balance: ₹{alert.balance_at_alert} / Limit: ₹{alert.credit_limit_at_alert}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold">{new Date(alert.created_at).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/shops/${alert.shop_id}`} className="text-xs font-black text-green-600 hover:underline">
                    View Shop
                  </Link>
                  <button onClick={() => resolveCreditAlert(alert.id)} className="text-green-600 hover:bg-green-50 p-1.5 rounded-full">
                    <Check size={14} />
                  </button>
                </div>
              </div>
            ))}
            {creditAlerts.length === 0 && <p className="p-4 text-xs font-bold text-slate-400 text-center">કોઈ credit alert નથી</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
