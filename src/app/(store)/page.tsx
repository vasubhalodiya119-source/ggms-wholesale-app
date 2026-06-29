'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Mic, Package, IndianRupee } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Category, Settings, DailyRate } from '@/lib/types'

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [rates, setRates] = useState<DailyRate[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('sort_order')
      .then(({ data }) => setCategories((data as Category[]) || []))

    supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => setSettings(data as Settings))

    supabase
      .from('daily_rates')
      .select('*')
      .order('sort_order')
      .then(({ data }) => setRates((data as DailyRate[]) || []))
  }, [])

  return (
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

      {/* App download banner */}
      <div className="rounded-2xl bg-gradient-to-br from-green-100 via-lime-50 to-yellow-50 border border-green-100 p-4 flex items-center justify-between">
        <div>
          <p className="font-bold text-slate-800 text-sm leading-snug">
            Download Our Grocery App
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Fast Delivery • Fresh Products • Best Prices</p>
          {settings?.app_download_url && (
            <a
              href={settings.app_download_url}
              download="GGMS-Wholesale.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs font-bold bg-green-600 text-white px-3 py-1.5 rounded-full"
            >
              Download APK Now
            </a>
          )}
        </div>
        <div className="w-16 h-16 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
          <Package size={32} className="text-green-600" />
        </div>
      </div>

      {/* Shop by department */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 text-center">Shop by Department</h2>
        <p className="text-sm text-slate-400 text-center mt-1">Select a category to view items</p>
      </div>

      <div className="grid grid-cols-3 gap-3 pb-4">
        <Link
          href="/products"
          className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-col items-center gap-2 shadow-sm"
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
            className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-col items-center gap-2 shadow-sm"
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
  )
}
