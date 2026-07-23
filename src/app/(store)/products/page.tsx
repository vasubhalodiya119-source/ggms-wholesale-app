'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Package, Plus, Minus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Product, Category, ProductVariant } from '@/lib/types'
import { useCart } from '@/lib/cart-context'

import ProductSkeleton from '@/components/ProductSkeleton'

function ProductsContent() {
  const searchParams = useSearchParams()
  const categoryId = searchParams.get('category')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(categoryId)
  const [variants, setVariants] = useState<Record<string, ProductVariant[]>>({})
  const [selectedVariant, setSelectedVariant] = useState<Record<string, ProductVariant | null>>({})
  const [showVariantPicker, setShowVariantPicker] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { items, addItem, updateQty } = useCart()

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      setCategories((data as Category[]) || [])
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    let query = supabase.from('products').select('*').eq('is_active', true)
    if (activeCategory) query = query.eq('category_id', activeCategory)
    query.order('name').then(async ({ data }) => {
      const prods = (data as Product[]) || []
      setProducts(prods)

      if (prods.length > 0) {
        const ids = prods.map(p => p.id)
        const { data: varData } = await supabase
          .from('product_variants')
          .select('*')
          .in('product_id', ids)
          .order('sort_order')

        const grouped: Record<string, ProductVariant[]> = {}
        for (const v of (varData as ProductVariant[]) || []) {
          if (!grouped[v.product_id]) grouped[v.product_id] = []
          grouped[v.product_id].push(v)
        }
        setVariants(grouped)

        const autoSelect: Record<string, ProductVariant | null> = {}
        for (const p of prods) {
          autoSelect[p.id] = grouped[p.id]?.[0] || null
        }
        setSelectedVariant(autoSelect)
      }
      setLoading(false)
    })
  }, [activeCategory])

  function getQty(productId: string) {
    return items.find((i) => i.product.id === productId)?.qty || 0
  }

  function getEffectivePrice(product: Product) {
    const v = selectedVariant[product.id]
    return v ? v.price : product.price
  }

  function getEffectiveMrp(product: Product) {
    const v = selectedVariant[product.id]
    return v?.mrp || null
  }

  function getDiscount(product: Product) {
    const price = getEffectivePrice(product)
    const mrp = getEffectiveMrp(product)
    if (!mrp || mrp <= price) return null
    return Math.round((1 - price / mrp) * 100)
  }

  function handleAddToCart(product: Product) {
    const v = selectedVariant[product.id]
    addItem(product, 1, v || undefined)
  }

  if (loading) {
    return <ProductSkeleton />
  }

  return (
    <div className="px-4 pt-3 space-y-3">
      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${
            !activeCategory ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
          }`}
        >
          All Products
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${
              activeCategory === cat.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {cat.name.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 gap-3 pb-4">
        {products.map((product) => {
          const qty = getQty(product.id)
          const outOfStock = product.stock_qty <= 0
          const productVariants = variants[product.id] || []
          const hasVariants = productVariants.length > 0
          const selVariant = selectedVariant[product.id]
          const price = getEffectivePrice(product)
          const mrp = getEffectiveMrp(product)
          const discount = getDiscount(product)

          return (
            <div key={product.id} className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm flex flex-col">
              {/* Image */}
              <div className="w-full aspect-square rounded-xl bg-slate-100 overflow-hidden relative mb-2">
                {discount && (
                  <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    -{discount}%
                  </div>
                )}
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

              {/* Category chip */}
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                {categories.find(c => c.id === product.category_id)?.name || ''}
              </p>

              {/* Name */}
              <p className="text-sm font-extrabold text-slate-800 leading-tight line-clamp-2 mt-0.5">{product.name}</p>

              {/* Variant selector dropdown button */}
              {hasVariants && (
                <button
                  onClick={() => setShowVariantPicker(showVariantPicker === product.id ? null : product.id)}
                  className="mt-1.5 w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 font-semibold flex items-center justify-between"
                >
                  <span>{selVariant ? `${selVariant.size_label} - ₹${selVariant.price}${selVariant.mrp ? ` (MRP ₹${selVariant.mrp})` : ''}` : 'Size પસંદ કરો'}</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              )}

              {/* Pricing */}
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <p className="text-green-700 font-extrabold text-base">₹{price}</p>
                {selVariant?.size_label && <p className="text-[10px] text-slate-400">/{selVariant.size_label}</p>}
                {mrp && <p className="text-[10px] text-slate-400 line-through">₹{mrp}</p>}
              </div>

              {/* Qty + Add button */}
              {!outOfStock && (
                qty === 0 ? (
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="mt-2 w-full bg-green-600 text-white text-xs font-bold py-2 rounded-xl"
                  >
                    ADD TO CART
                  </button>
                ) : (
                  <div className="mt-2 flex items-center justify-between bg-green-600 rounded-xl px-2 py-1.5">
                    <button onClick={() => updateQty(product.id, qty - 1)} className="text-white"><Minus size={15} /></button>
                    <span className="text-white font-bold text-sm">{qty}</span>
                    <button onClick={() => updateQty(product.id, qty + 1)} className="text-white"><Plus size={15} /></button>
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

      {/* Variant picker bottom sheet */}
      {showVariantPicker && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowVariantPicker(null)}>
          <div className="bg-white w-full rounded-t-3xl p-4 space-y-2" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />
            {(variants[showVariantPicker] || []).map((v) => {
              const disc = v.mrp && v.mrp > v.price ? Math.round((1 - v.price / v.mrp) * 100) : null
              const isSelected = selectedVariant[showVariantPicker]?.id === v.id
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedVariant(prev => ({ ...prev, [showVariantPicker]: v }))
                    setShowVariantPicker(null)
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left ${isSelected ? 'border-green-500 bg-green-50' : 'border-slate-100'}`}
                >
                  <span className="text-sm font-semibold text-slate-700">
                    {v.size_label} - ₹{v.price}
                    {v.mrp && <span className="text-slate-400 text-xs ml-1">(MRP ₹{v.mrp})</span>}
                    {disc && <span className="text-red-500 text-xs font-bold ml-1">-{disc}%</span>}
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-green-500 bg-green-500' : 'border-slate-300'}`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductsContent />
    </Suspense>
  )
}
