import StoreHeader from '@/components/StoreHeader'
import BottomNav from '@/components/BottomNav'
import NotificationPrompt from '@/components/NotificationPrompt'
import PushDebug from '@/components/PushDebug'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 pb-16 lg:pb-0">
      <PushDebug />
      <NotificationPrompt />
      <StoreHeader />
      <main className="flex-1 overflow-y-auto pb-4">{children}</main>
      <BottomNav />
    </div>
  )
}
