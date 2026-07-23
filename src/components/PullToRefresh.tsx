'use client'

import React, { useState, useRef, TouchEvent } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startYRef = useRef(0)
  const isPullingRef = useRef(false)
  const threshold = 70

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (window.scrollY === 0) {
      startYRef.current = e.touches[0].clientY
      isPullingRef.current = true
    }
  }

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isPullingRef.current || refreshing) return
    const currentY = e.touches[0].clientY
    const diff = currentY - startYRef.current

    if (diff > 0 && window.scrollY === 0) {
      // Add resistance to pull distance
      const distance = Math.min(diff * 0.45, 100)
      setPullDistance(distance)
    }
  }

  const handleTouchEnd = async () => {
    if (!isPullingRef.current) return
    isPullingRef.current = false

    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true)
      setPullDistance(threshold)
      try {
        await onRefresh()
      } catch (err) {
        console.error('Pull to refresh failed:', err)
      } finally {
        setRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-full"
    >
      {/* Pull / Refresh Indicator */}
      <motion.div
        animate={{
          height: pullDistance > 0 ? pullDistance : 0,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="overflow-hidden flex items-center justify-center bg-slate-50 border-b border-slate-100"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-green-700 py-2">
          <RefreshCw
            size={18}
            className={`transition-transform duration-200 ${
              refreshing ? 'animate-spin text-green-600' : ''
            }`}
            style={{
              transform: refreshing ? undefined : `rotate(${pullDistance * 3}deg)`,
            }}
          />
          <span>{refreshing ? 'તાજો ડેટા લોડ થઈ રહ્યો છે...' : pullDistance >= threshold ? 'છોડો અને રીફ્રેશ કરો' : 'રીફ્રેશ કરવા નીચે ખેંચો'}</span>
        </div>
      </motion.div>

      {children}
    </div>
  )
}
