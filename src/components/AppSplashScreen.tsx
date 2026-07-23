'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export default function AppSplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B7A3E] select-none touch-none"
      style={{ willChange: 'opacity' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1.0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-4 transform-gpu"
        style={{ willChange: 'transform, opacity' }}
      >
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white p-3 shadow-2xl flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="GGM&S Wholesale"
            width={128}
            height={128}
            className="w-full h-full object-contain"
            priority
          />
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-white font-extrabold text-xl sm:text-2xl tracking-tight">
            GGM&amp;S Wholesale
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm font-medium tracking-wide">
            જથ્થાબંધ ગ્રોસરી ઓર્ડર એપ
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
