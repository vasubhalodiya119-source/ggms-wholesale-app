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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-stretch px-1 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
      <div className="w-full max-w-7xl mx-auto flex items-stretch">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative transition-colors duration-150 ${
                active ? 'text-green-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="relative">
                <Icon size={21} strokeWidth={active ? 2.4 : 2} />
                {href === '/cart' && uniqueCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-orange-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                    {uniqueCount}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-semibold tracking-tight">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
