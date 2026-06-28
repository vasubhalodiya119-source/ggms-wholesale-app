'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Package, Plus, Minus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Product, Category } from '@/lib/types'
import { useCart } from '@/lib/cart-context'

function ProductsContent() {
  const searchParams = useSearchParams()
  const categoryId = searchParams.get('category')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(categoryId)
  const { items, addItem, updateQty } = useCart()

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      setCategories((data as Category[]) || [])
    })
  }, [])

  useEffect(() => {
    let query = supabase.from('products').select('*').eq('is_active', true)
    if (activeCategory) query = query.eq('category_id', activeCategory)
    query.order('name').then(({ data }) => setProducts((data as Product[]) || []))
  }, [activeCategory])

  function getQty(productId: string) {
    return items.find((i) => i.product.id === productId)?.qty || 0
  }

  return (
    <div className="px-4 pt-3 space-y-3">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${
            !activeCategory ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-600 border-slate-200'
          }`}
        >
          ALL PRODUCTS
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${
              activeCategory === cat.id
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {cat.name.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 pb-4">
        {products.map((product) => {
          const qty = getQty(product.id)
          const outOfStock = product.stock_qty <= 0
          return (
            <div key={product.id} className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm flex flex-col">
              <div className="w-full aspect-square rounded-xl bg-slate-100 overflow-hidden relative mb-2">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Package size={28} />
                  </div>
                )}
                {outOfStock && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-200">
                      OUT OF STOCK
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm font-bold text-slate-800 leading-tight line-clamp-2">{product.name}</p>
              {product.name_gujarati && (
                <p className="text-[11px] text-slate-400 mt-0.5">({product.name_gujarati})</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <p className="text-green-700 font-extrabold text-sm">
                  ₹{product.price}
                  <span className="text-[10px] text-slate-400 font-medium">/{product.unit}</span>
                </p>
              </div>

              {!outOfStock && (
                qty === 0 ? (
                  <button
                    onClick={() => addItem(product, 1)}
                    className="mt-2 w-full bg-green-600 text-white text-xs font-bold py-2 rounded-xl"
                  >
                    ADD
                  </button>
                ) : (
                  <div className="mt-2 flex items-center justify-between bg-green-600 rounded-xl px-2 py-1.5">
                    <button onClick={() => updateQty(product.id, qty - 1)} className="text-white">
                      <Minus size={15} />
                    </button>
                    <span className="text-white font-bold text-sm">{qty}</span>
                    <button onClick={() => updateQty(product.id, qty + 1)} className="text-white">
                      <Plus size={15} />
                    </button>
                  </div>
                )
              )}
            </div>
          )
        })}
      </div>

      {products.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-10">આ કેટેગરીમાં કોઈ પ્રોડક્ટ નથી</p>
      )}
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-slate-400">Loading...</div>}>
      <ProductsContent />
    </Suspense>
  )
}
