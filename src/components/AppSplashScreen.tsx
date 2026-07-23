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
        className="flex flex-col items-center gap-5 transform-gpu"
        style={{ willChange: 'transform, opacity' }}
      >
        <div className="w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
          <Image
            src="/logo-transparent.png"
            alt="GGM&S Wholesale"
            width={176}
            height={176}
            className="w-full h-full object-contain drop-shadow-xl"
            priority
          />
        </div>
        <div className="text-center space-y-1.5">
          <h1 className="text-white font-extrabold text-2xl sm:text-3xl tracking-tight">
            GGM&amp;S Wholesale
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base font-medium tracking-wide">
            જથ્થાબંધ ગ્રોસરી ઓર્ડર એપ
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
