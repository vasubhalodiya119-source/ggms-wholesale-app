'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutGrid, ShoppingCart, User } from 'lucide-react'
import { useCart } from '@/lib/cart-context'

const navItems = [
  { href: '/', label: 'હોમ', icon: Home },
  { href: '/categories', label: 'કેટેગરી', icon: LayoutGrid },
  { href: '/cart', label: 'બાસ્કેટ', icon: ShoppingCart },
  { href: '/account', label: 'એકાઉન્ટ', icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { uniqueCount } = useCart()

  return (
    <nav className="sticky bottom-0 z-30 bg-white border-t border-slate-200 flex items-stretch px-1 pb-[max(env(safe-area-inset-bottom),0px)]">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative ${
              active ? 'text-green-600' : 'text-slate-400'
            }`}
          >
            <span className="relative">
              <Icon size={21} strokeWidth={active ? 2.4 : 2} />
              {href === '/cart' && uniqueCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-orange-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {uniqueCount}
                </span>
              )}
            </span>
            <span className="text-[10px] font-semibold">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
