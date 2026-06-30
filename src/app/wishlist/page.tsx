'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Heart } from 'lucide-react'

export default function WishlistPage() {
  const router = useRouter()

  return (
    <div className="px-4 pt-3 pb-4 sm:max-w-md sm:mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-extrabold text-slate-900">Wishlist</h1>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center text-center">
        <Heart size={28} className="text-slate-300 mb-2" />
        <p className="text-sm text-slate-400">Wishlist હાલમાં ખાલી છે</p>
      </div>
    </div>
  )
}
