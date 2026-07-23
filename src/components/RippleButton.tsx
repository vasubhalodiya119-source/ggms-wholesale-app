'use client'

import React, { useState, MouseEvent } from 'react'

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
  rippleColor?: string
}

type Ripple = {
  x: number
  y: number
  size: number
  id: number
}

export default function RippleButton({
  children,
  className = '',
  rippleColor = 'rgba(255, 255, 255, 0.4)',
  onClick,
  ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([])

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2

    const newRipple: Ripple = {
      x,
      y,
      size,
      id: Date.now(),
    }

    setRipples((prev) => [...prev, newRipple])

    if (onClick) {
      onClick(e)
    }
  }

  const handleAnimationEnd = (id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <button
      {...props}
      onClick={handleClick}
      className={`relative overflow-hidden active:scale-[0.98] transition-transform duration-150 ${className}`}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          onAnimationEnd={() => handleAnimationEnd(ripple.id)}
          className="animate-ripple"
          style={{
            top: ripple.y,
            left: ripple.x,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: rippleColor,
          }}
        />
      ))}
    </button>
  )
}
