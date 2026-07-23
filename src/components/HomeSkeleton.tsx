'use client'

export default function HomeSkeleton() {
  return (
    <div className="px-4 pt-3 space-y-4 animate-pulse">
      {/* Search Bar Skeleton */}
      <div className="h-12 bg-slate-200/80 rounded-2xl w-full" />

      {/* Headline Banner Skeleton */}
      <div className="h-8 bg-amber-100/70 rounded-full w-full" />

      {/* Banner Carousel Skeleton */}
      <div className="h-40 bg-slate-200/90 rounded-2xl w-full" />

      {/* Today's Rate Board Skeleton */}
      <div className="h-32 bg-slate-800/90 rounded-2xl w-full overflow-hidden p-4 space-y-3">
        <div className="h-4 bg-slate-700 rounded w-1/3" />
        <div className="h-4 bg-slate-700/60 rounded w-full" />
        <div className="h-4 bg-slate-700/60 rounded w-5/6" />
      </div>

      {/* Download Card Skeleton */}
      <div className="h-24 bg-gradient-to-r from-amber-100/80 to-amber-200/50 rounded-2xl w-full" />

      {/* Department Section Title Skeleton */}
      <div className="flex flex-col items-center space-y-2 pt-2">
        <div className="h-6 bg-slate-200/90 rounded-lg w-48" />
        <div className="h-3.5 bg-slate-200/70 rounded-lg w-56" />
      </div>

      {/* Category Grid Skeleton */}
      <div className="grid grid-cols-3 gap-3 pb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-3 flex flex-col items-center gap-2 shadow-sm">
            <div className="w-full aspect-square rounded-xl bg-slate-200/80" />
            <div className="h-3 bg-slate-200/90 rounded w-4/5" />
          </div>
        ))}
      </div>
    </div>
  )
}
