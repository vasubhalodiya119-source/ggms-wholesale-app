import StoreHeader from '@/components/StoreHeader'
import BottomNav from '@/components/BottomNav'
import NotificationPrompt from '@/components/NotificationPrompt'
import PageTransition from '@/components/PageTransition'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <NotificationPrompt />
      <StoreHeader />
      <main className="flex-1 flex flex-col pb-20 lg:pb-4">
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav />
    </div>
  )
}
