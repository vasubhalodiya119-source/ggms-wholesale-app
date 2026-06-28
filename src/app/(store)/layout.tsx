import StoreHeader from '@/components/StoreHeader'
import BottomNav from '@/components/BottomNav'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto w-full bg-slate-100">
      <StoreHeader />
      <main className="flex-1 overflow-y-auto pb-4">{children}</main>
      <BottomNav />
    </div>
  )
}
