'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
} from 'lucide-react'
import { useAdminAuth } from '@/lib/admin-auth'

const navItems = [
  { href: '/admin/dashboard', label: 'DASHBOARD', icon: TrendingUp },
  { href: '/admin/orders', label: 'ORDERS', icon: ClipboardList },
  { href: '/admin/inventory', label: 'INVENTORY', icon: Package },
  { href: '/admin/categories', label: 'CATEGORIES', icon: LayoutGrid },
  { href: '/admin/rates', label: 'આજનો ભાવ', icon: IndianRupee },
  { href: '/admin/shops', label: 'SHOPS & CREDIT', icon: BookUser },
  { href: '/admin/banners', label: 'AD SLIDER BANNERS', icon: ImageIcon },
  { href: '/admin/qr', label: 'COUNTER QR', icon: Smartphone },
  { href: '/admin/voice-search', label: 'VOICE SEARCH ANALYTICS', icon: Mic },
  { href: '/admin/ai-assistant', label: 'AI ASSISTANT', icon: Sparkles },
  { href: '/admin/notifications', label: 'NOTIFICATION CENTER', icon: Bell },
  { href: '/admin/settings', label: 'SHOP SETTINGS', icon: SettingsIcon },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { logout } = useAdminAuth()
  const router = useRouter()

  return (
    <div className="bg-white min-h-screen flex flex-col px-3 py-4">
      <div className="flex items-center gap-3 px-2 mb-4">
        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
          <Store size={20} />
        </div>
        <div>
          <p className="font-extrabold text-slate-900 text-sm">Admin Console</p>
          <p className="text-[10px] tracking-wide text-slate-400 font-bold uppercase">Backoffice</p>
        </div>
      </div>
      <div className="border-t border-slate-100 mb-2" />

      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide ${
                active ? 'bg-green-50 text-green-700' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-100 mt-2 pt-2">
        <button
          onClick={() => {
            logout()
            router.push('/admin')
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50"
        >
          <LogOut size={16} /> LOGOUT
        </button>
      </div>
    </div>
  )
}
