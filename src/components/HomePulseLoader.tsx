'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export default function HomePulseLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-white select-none touch-none"
      style={{ willChange: 'opacity' }}
    >
      <motion.div
        animate={{
          scale: [1.0, 1.12, 1.0],
          opacity: [0.5, 1.0, 0.5],
        }}
        transition={{
          duration: 0.9,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center transform-gpu"
        style={{ willChange: 'transform, opacity' }}
      >
        <Image
          src="/logo.png"
          alt="Loading..."
          width={160}
          height={160}
          className="w-full h-full object-contain"
          priority
        />
      </motion.div>
    </motion.div>
  )
}
