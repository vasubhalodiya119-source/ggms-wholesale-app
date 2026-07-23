'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Package, IndianRupee, Mic } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Category, Settings, DailyRate } from '@/lib/types'
import { PremiumDownloadCard } from '@/components/PremiumDownloadCard'
import { useAdminAuth } from '@/lib/admin-auth'
import AppSplashScreen from '@/components/AppSplashScreen'
import HomePulseLoader from '@/components/HomePulseLoader'
import PullToRefresh from '@/components/PullToRefresh'

type Banner = { id: string; image_url: string; link_url: string | null }

const CACHE_KEYS = {
  categories: 'ggms_cache_categories',
  settings: 'ggms_cache_settings',
  rates: 'ggms_cache_rates',
  banners: 'ggms_cache_banners',
}

export default function HomePage() {
  const router = useRouter()
  const { admin, loading: adminLoading } = useAdminAuth()

  // Data States
  const [categories, setCategories] = useState<Category[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [rates, setRates] = useState<DailyRate[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [search, setSearch] = useState('')
  const [appUrl, setAppUrl] = useState('')
  const [activeBanner, setActiveBanner] = useState(0)
  const bannerRef = useRef<HTMLDivElement>(null)

  // Navigation & Loading States
  const [isMounted, setIsMounted] = useState(false)
  const [shouldRedirectAdmin, setShouldRedirectAdmin] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [isDataLoading, setIsDataLoading] = useState(true)

  // 1. Splash Screen Timer (1500ms)
  useEffect(() => {
    setIsMounted(true)
    const lastActive = localStorage.getItem('ggms_last_active_panel')
    const hasAdmin = !!localStorage.getItem('ggms_admin_session')

    if (lastActive === 'admin' || hasAdmin) {
      setShouldRedirectAdmin(true)
    } else {
      localStorage.setItem('ggms_last_active_panel', 'customer')
    }

    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // 2. Redirect check for admin
  useEffect(() => {
    if (shouldRedirectAdmin) {
      const hasAdmin = !!localStorage.getItem('ggms_admin_session')
      if (hasAdmin) {
        if (!adminLoading && admin) {
          router.push('/admin/dashboard')
        }
      } else {
        router.push('/admin')
      }
    }
  }, [shouldRedirectAdmin, admin, adminLoading, router])

  // 3. App URL & Notification permission
  useEffect(() => {
    if (typeof window !== 'undefined') {
      Promise.resolve().then(() => {
        setAppUrl(window.location.origin)
      })
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [])

  // 4. Instant Cache Restoration + Fresh Data Preloading
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cachedCat = sessionStorage.getItem(CACHE_KEYS.categories)
        const cachedSet = sessionStorage.getItem(CACHE_KEYS.settings)
        const cachedRat = sessionStorage.getItem(CACHE_KEYS.rates)
        const cachedBan = sessionStorage.getItem(CACHE_KEYS.banners)

        if (cachedCat) setCategories(JSON.parse(cachedCat))
        if (cachedSet) setSettings(JSON.parse(cachedSet))
        if (cachedRat) setRates(JSON.parse(cachedRat))
        if (cachedBan) setBanners(JSON.parse(cachedBan))

        if (cachedCat && cachedSet) {
          setIsDataLoading(false)
        }
      } catch (e) {
        console.warn('Cache read error:', e)
      }
    }

    preloadAllHomeData()
  }, [])

  async function preloadAllHomeData() {
    try {
      const [catRes, setRes, ratRes, banRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('settings').select('*').eq('id', 1).single(),
        supabase.from('daily_rates').select('*').order('sort_order'),
        supabase.from('banners').select('*').eq('is_active', true).order('sort_order')
      ])

      const fetchedCategories = (catRes.data as Category[]) || []
      const fetchedSettings = (setRes.data as Settings) || null
      const fetchedRates = (ratRes.data as DailyRate[]) || []
      const fetchedBanners = (banRes.data as Banner[]) || []

      setCategories(fetchedCategories)
      setSettings(fetchedSettings)
      setRates(fetchedRates)
      setBanners(fetchedBanners)

      // Save to Session Storage Cache
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(CACHE_KEYS.categories, JSON.stringify(fetchedCategories))
        if (fetchedSettings) sessionStorage.setItem(CACHE_KEYS.settings, JSON.stringify(fetchedSettings))
        sessionStorage.setItem(CACHE_KEYS.rates, JSON.stringify(fetchedRates))
        sessionStorage.setItem(CACHE_KEYS.banners, JSON.stringify(fetchedBanners))
      }
    } catch (err) {
      console.error('Home data preloading error:', err)
    } finally {
      setIsDataLoading(false)
    }
  }

  // 5. Auto-slide banners every 3s
  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => setActiveBanner(prev => (prev + 1) % banners.length), 3000)
    return () => clearInterval(timer)
  }, [banners.length])

  // If redirecting admin
  if (!isMounted || shouldRedirectAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {/* 1. Full-screen Green Splash Screen (1500ms) */}
        {showSplash && <AppSplashScreen key="splash" />}

        {/* 2. White Home Pulse Loader (Shows if data is still fetching after splash) */}
        {!showSplash && isDataLoading && <HomePulseLoader key="pulse-loader" />}
      </AnimatePresence>

      {/* 3. Main Home Content with Pull to Refresh & Smooth Fade-in */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showSplash || isDataLoading ? 0 : 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ willChange: 'opacity' }}
      >
        <PullToRefresh onRefresh={preloadAllHomeData}>
          <div className="px-4 pt-3 space-y-4">
            {/* Search bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (search.trim()) window.location.href = `/search?q=${encodeURIComponent(search)}`
              }}
              className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-sm"
            >
              <Search size={18} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pantry items, spices, pulses..."
                className="flex-1 outline-none text-sm text-slate-700 placeholder:text-slate-400"
              />
              <Mic size={18} className="text-slate-400" />
            </form>

            {/* Scrolling headline */}
            {settings?.headline_text && (
              <div className="bg-amber-50 border border-amber-200 rounded-full px-4 py-2 overflow-hidden">
                <div className="whitespace-nowrap overflow-hidden">
                  <p className="text-amber-700 text-xs font-semibold inline-block animate-marquee">
                    🔥 {settings.headline_text}
                  </p>
                </div>
              </div>
            )}

            {/* Banner Carousel */}
            {banners.length > 0 && (
              <div className="relative rounded-2xl overflow-hidden shadow-sm" ref={bannerRef}>
                <div
                  className="flex transition-transform duration-500 ease-in-out transform-gpu"
                  style={{ transform: `translateX(-${activeBanner * 100}%)` }}
                >
                  {banners.map((b) => (
                    <div key={b.id} className="flex-shrink-0 w-full">
                      {b.link_url ? (
                        <a href={b.link_url} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={b.image_url} alt="banner" className="w-full h-40 object-cover" />
                        </a>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.image_url} alt="banner" className="w-full h-40 object-cover" />
                      )}
                    </div>
                  ))}
                </div>
                {banners.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {banners.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveBanner(i)}
                        className={`rounded-full transition-all ${i === activeBanner ? 'w-4 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Today's Rate Board */}
            {rates.length > 0 && (
              <div className="rounded-2xl bg-slate-900 overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800">
                  <IndianRupee size={15} className="text-amber-400" />
                  <p className="text-amber-400 font-extrabold text-sm tracking-wide">આજનો ભાવ</p>
                  <span className="text-slate-400 text-[10px] ml-auto">TODAY&apos;S RATE</span>
                </div>
                <div className="divide-y divide-slate-700/60">
                  {rates.map((rate) => (
                    <div key={rate.id} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-white text-sm font-semibold">
                        {rate.item_name}
                        {rate.item_name_gujarati && (
                          <span className="text-slate-400 text-xs font-normal"> ({rate.item_name_gujarati})</span>
                        )}
                      </span>
                      <span className="text-amber-400 font-extrabold text-sm">
                        ₹{rate.rate}
                        <span className="text-slate-400 text-xs font-medium">/{rate.unit}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Premium App Download Card */}
            <PremiumDownloadCard
              downloadUrl={settings?.app_download_url ?? null}
              appUrl={appUrl}
            />

            {/* Shop by department */}
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 text-center">Shop by Department</h2>
              <p className="text-sm text-slate-400 text-center mt-1">Select a category to view items</p>
            </div>

            <div className="grid grid-cols-3 gap-3 pb-4">
              <Link
                href="/products"
                className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-col items-center gap-2 shadow-sm hover:shadow-md active:scale-95 transition-all"
              >
                <div className="w-full aspect-square rounded-xl bg-green-600 flex items-center justify-center">
                  <Package size={28} className="text-white" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">ALL PRODUCTS</span>
              </Link>

              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.id}`}
                  className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-col items-center gap-2 shadow-sm hover:shadow-md active:scale-95 transition-all"
                >
                  <div className="w-full aspect-square rounded-xl bg-slate-100 overflow-hidden relative">
                    {cat.image_url ? (
                      <Image src={cat.image_url} alt={cat.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package size={24} />
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">
                    {cat.name.toUpperCase()}
                    {cat.name_gujarati && (
                      <span className="block text-[10px] font-medium text-slate-400">({cat.name_gujarati})</span>
                    )}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </PullToRefresh>
      </motion.div>
    </>
  )
}
