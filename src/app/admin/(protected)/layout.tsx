'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/lib/admin-auth'
import AdminSidebar from '@/components/AdminSidebar'

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !admin) {
      window.location.href = '/admin'
    }
  }, [loading, admin])

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
    </div>
  )
  if (!admin) return null

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop sidebar - hidden on mobile */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-100 hidden md:block bg-white">
        <AdminSidebar />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile top header with hamburger - only visible on mobile */}
        <div className="md:hidden">
          <AdminSidebar />
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
