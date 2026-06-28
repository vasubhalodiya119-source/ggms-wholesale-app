'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Category } from '@/lib/types'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      setCategories((data as Category[]) || [])
    })
  }, [])

  return (
    <div className="px-4 pt-3">
      <h2 className="text-lg font-extrabold text-slate-900 mb-3">બધી કેટેગરી</h2>
      <div className="grid grid-cols-3 gap-3 pb-4">
        <Link
          href="/products"
          className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-col items-center gap-2 shadow-sm"
        >
          <div className="w-full aspect-square rounded-xl bg-green-600 flex items-center justify-center">
            <Package size={28} className="text-white" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">ALL PRODUCTS</span>
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.id}`}
            className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-col items-center gap-2 shadow-sm"
          >
            <div className="w-full aspect-square rounded-xl bg-slate-100 overflow-hidden relative">
              {cat.image_url ? (
                <Image src={cat.image_url} alt={cat.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Package size={24} />
                </div>
              )}
            </div>
            <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">
              {cat.name.toUpperCase()}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
