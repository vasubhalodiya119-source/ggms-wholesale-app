'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ClipboardList, Package, Store, Bell } from 'lucide-react'

const navItems = [
  { href: '/admin-app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin-app/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin-app/inventory', label: 'Inventory', icon: Package },
  { href: '/admin-app/shops', label: 'Shops', icon: Store },
  { href: '/admin-app/notifications', label: 'Alerts', icon: Bell },
]

export default function AdminBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-green-900 border-t border-green-700 flex sm:max-w-md sm:mx-auto">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors ${
              active ? 'text-yellow-400' : 'text-green-400'
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
