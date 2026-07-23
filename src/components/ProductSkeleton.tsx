'use client'

export default function ProductSkeleton() {
  return (
    <div className="px-4 pt-3 space-y-3 animate-pulse">
      {/* Category Pills Skeleton */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-7 w-24 bg-slate-200/80 rounded-full flex-shrink-0" />
        ))}
      </div>

      {/* Product Cards Skeleton */}
      <div className="grid grid-cols-2 gap-3 pb-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm flex flex-col gap-2">
            <div className="w-full aspect-square rounded-xl bg-slate-200/90" />
            <div className="h-3 bg-slate-200/70 rounded w-1/2" />
            <div className="h-4 bg-slate-200/90 rounded w-5/6" />
            <div className="h-4 bg-slate-200/80 rounded w-2/3 mt-1" />
            <div className="h-8 bg-slate-200 rounded-xl w-full mt-1" />
          </div>
        ))}
      </div>
    </div>
  )
}
