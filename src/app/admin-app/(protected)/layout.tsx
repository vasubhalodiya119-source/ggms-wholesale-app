'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAdminAuth } from '@/lib/admin-auth'
import AdminBottomNav from '@/components/AdminBottomNav'
import AdminAppHeader from '@/components/AdminAppHeader'

const pageTitles: Record<string, string> = {
  '/admin-app/dashboard': 'Dashboard',
  '/admin-app/orders': 'Orders',
  '/admin-app/inventory': 'Inventory',
  '/admin-app/shops': 'Shops & Credit',
  '/admin-app/notifications': 'Notifications',
  '/admin-app/rates': 'આજનો ભાવ',
  '/admin-app/settings': 'Settings',
  '/admin-app/categories': 'Categories',
}

export default function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdminAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !admin) router.push('/admin-app')
  }, [admin, loading, router])

  if (loading) return (
    <div className="min-h-screen bg-green-900 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!admin) return null

  const title = pageTitles[pathname] || 'GGM&S Admin'

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col sm:max-w-md sm:mx-auto">
      <AdminAppHeader title={title} />
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>
      <AdminBottomNav />
    </div>
  )
}
