'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/lib/admin-auth'
import AdminSidebar from '@/components/AdminSidebar'

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !admin) router.push('/admin')
  }, [loading, admin, router])

  if (loading) return <div className="p-6 text-sm text-slate-400">Loading...</div>
  if (!admin) return null

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 flex-shrink-0 border-r border-slate-100 hidden md:block">
        <AdminSidebar />
      </aside>
      <main className="flex-1 bg-slate-50 min-h-screen overflow-y-auto">{children}</main>
    </div>
  )
}
