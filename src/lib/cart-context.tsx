'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { Product, CartItem } from './types'

type CartContextType = {
  items: CartItem[]
  addItem: (product: Product, qty?: number) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  clearCart: () => void
  subtotal: number
  uniqueCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  function addItem(product: Product, qty: number = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + qty } : i
        )
      }
      return [...prev, { product, qty }]
    })
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.product.id !== productId))
  }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) {
      removeItem(productId)
      return
    }
    setItems((prev) => prev.map((i) => (i.product.id === productId ? { ...i, qty } : i)))
  }

  function clearCart() {
    setItems([])
  }

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.qty, 0)
  const uniqueCount = items.length

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, subtotal, uniqueCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
