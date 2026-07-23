'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-stretch px-1 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-2px_12px_rgba(0,0,0,0.05)] select-none">
      <div className="w-full max-w-7xl mx-auto flex items-stretch relative">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative z-10 transition-colors duration-200 ${
                active ? 'text-green-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {/* Active Tab Background Pill Animation */}
              {active && (
                <motion.div
                  layoutId="bottomNavActivePill"
                  className="absolute inset-x-2 top-1 bottom-1 bg-green-50/80 rounded-2xl -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}

              {/* Icon with Spring Motion */}
              <motion.span
                animate={active ? { scale: [1, 1.2, 1.0], y: [-2, 0] } : { scale: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="relative flex items-center justify-center"
              >
                <Icon size={21} strokeWidth={active ? 2.5 : 2} />
                {href === '/cart' && uniqueCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-2.5 bg-orange-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm"
                  >
                    {uniqueCount}
                  </motion.span>
                )}
              </motion.span>

              {/* Label */}
              <span className={`text-[10px] tracking-tight ${active ? 'font-bold text-green-700' : 'font-semibold text-slate-500'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
