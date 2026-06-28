'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from './supabase'
import { Admin } from './types'

type AdminAuthContextType = {
  admin: Admin | null
  loading: boolean
  login: (phone: string, password: string) => Promise<{ error: string | null }>
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)
const STORAGE_KEY = 'ggms_admin_session'

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY)
    if (savedId) {
      supabase.from('admins').select('*').eq('id', savedId).single().then(({ data }) => {
        if (data) setAdmin(data as Admin)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [])

  async function login(phone: string, password: string) {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('phone', phone)
      .eq('password', password)
      .maybeSingle()

    if (error) return { error: 'કંઈક ભૂલ થઈ' }
    if (!data) return { error: 'ફોન નંબર અથવા પાસવર્ડ ખોટો છે' }

    setAdmin(data as Admin)
    localStorage.setItem(STORAGE_KEY, data.id)
    return { error: null }
  }

  function logout() {
    setAdmin(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
