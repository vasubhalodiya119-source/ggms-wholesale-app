'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Store,
  TrendingUp,
  ClipboardList,
  Package,
  LayoutGrid,
  Image as ImageIcon,
  Smartphone,
  Mic,
  Sparkles,
  Bell,
  IndianRupee,
  Settings as SettingsIcon,
  LogOut,
  BookUser,
  Menu,
  X,
} from 'lucide-react'
import { useAdminAuth } from '@/lib/admin-auth'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: TrendingUp },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/inventory', label: 'Inventory', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: LayoutGrid },
  { href: '/admin/rates', label: 'આજનો ભાવ', icon: IndianRupee },
  { href: '/admin/shops', label: 'Shops & Credit', icon: BookUser },
  { href: '/admin/banners', label: 'Ad Banners', icon: ImageIcon },
  { href: '/admin/qr', label: 'Counter QR', icon: Smartphone },
  { href: '/admin/voice-search', label: 'Voice Analytics', icon: Mic },
  { href: '/admin/ai-assistant', label: 'AI Assistant', icon: Sparkles },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/settings', label: 'Settings', icon: SettingsIcon },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { logout } = useAdminAuth()
  const router = useRouter()

  return (
    <div className="bg-white h-full flex flex-col px-3 py-4">
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
            <Store size={20} />
          </div>
          <div>
            <p className="font-extrabold text-slate-900 text-sm">Admin Console</p>
            <p className="text-[10px] tracking-wide text-slate-400 font-bold uppercase">Backoffice</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 active:bg-slate-200 md:hidden"
          >
            <X size={20} />
          </button>
        )}
      </div>
      <div className="border-t border-slate-100 mb-2" />

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold tracking-wide ${
                active ? 'bg-green-50 text-green-700' : 'text-slate-500 hover:bg-slate-50 active:bg-slate-100'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-100 mt-2 pt-2">
        <button
          onClick={() => {
            logout()
            if (onClose) onClose()
            router.push('/admin')
          }}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 active:bg-red-100"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  )
}

// Mobile top bar with hamburger button
export function AdminMobileHeader({ onOpen }: { onOpen: () => void }) {
  const pathname = usePathname()
  const currentItem = navItems.find(item => pathname.startsWith(item.href))
  const pageTitle = currentItem?.label || 'Admin'

  return (
    <div className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-100 flex items-center gap-3 px-4 py-3">
      <button
        onClick={onOpen}
        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 active:bg-slate-200"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
          <Store size={14} />
        </div>
        <span className="font-extrabold text-slate-900 text-sm">{pageTitle}</span>
      </div>
    </div>
  )
}

// Drawer wrapper for mobile
export default function AdminSidebar() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col h-full">
        <SidebarContent />
      </div>

      {/* Mobile top bar */}
      <AdminMobileHeader onOpen={() => setDrawerOpen(true)} />

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Drawer panel */}
          <div
            className="absolute top-0 left-0 h-full w-72 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <SidebarContent onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
