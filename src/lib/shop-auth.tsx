'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from './supabase'
import { Shop } from './types'

type ShopAuthContextType = {
  shop: Shop | null
  loading: boolean
  login: (phone: string, password: string) => Promise<{ error: string | null }>
  signup: (data: { shop_name: string; owner_name: string; phone: string; password: string; address: string }) => Promise<{ error: string | null }>
  logout: () => void
  refreshShop: () => Promise<void>
}

const ShopAuthContext = createContext<ShopAuthContextType | undefined>(undefined)

const STORAGE_KEY = 'ggms_shop_session'

export function ShopAuthProvider({ children }: { children: ReactNode }) {
  const [shop, setShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY)
    if (savedId) {
      supabase.from('shops').select('*').eq('id', savedId).single().then(({ data }) => {
        if (data) setShop(data as Shop)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [])

  async function login(phone: string, password: string) {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('phone', phone)
      .eq('password', password)
      .maybeSingle()

    if (error) return { error: 'કંઈક ભૂલ થઈ, ફરી પ્રયત્ન કરો' }
    if (!data) return { error: 'ફોન નંબર અથવા પાસવર્ડ ખોટો છે' }
    if (!data.is_active) return { error: 'તમારું એકાઉન્ટ બંધ કરવામાં આવ્યું છે' }

    setShop(data as Shop)
    localStorage.setItem(STORAGE_KEY, data.id)
    return { error: null }
  }

  async function signup(formData: { shop_name: string; owner_name: string; phone: string; password: string; address: string }) {
    const { data: existing } = await supabase
      .from('shops')
      .select('id')
      .eq('phone', formData.phone)
      .maybeSingle()

    if (existing) return { error: 'આ ફોન નંબર પહેલેથી રજીસ્ટર છે' }

    const { data, error } = await supabase
      .from('shops')
      .insert({
        shop_name: formData.shop_name,
        owner_name: formData.owner_name,
        phone: formData.phone,
        password: formData.password,
        address: formData.address,
      })
      .select()
      .single()

    if (error) return { error: 'એકાઉન્ટ બનાવવામાં ભૂલ થઈ' }

    setShop(data as Shop)
    localStorage.setItem(STORAGE_KEY, data.id)
    return { error: null }
  }

  function logout() {
    setShop(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  async function refreshShop() {
    if (!shop) return
    const { data } = await supabase.from('shops').select('*').eq('id', shop.id).single()
    if (data) setShop(data as Shop)
  }

  return (
    <ShopAuthContext.Provider value={{ shop, loading, login, signup, logout, refreshShop }}>
      {children}
    </ShopAuthContext.Provider>
  )
}

export function useShopAuth() {
  const ctx = useContext(ShopAuthContext)
  if (!ctx) throw new Error('useShopAuth must be used within ShopAuthProvider')
  return ctx
}
