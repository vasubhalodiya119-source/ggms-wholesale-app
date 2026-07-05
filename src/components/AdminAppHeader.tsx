'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useAdminAuth } from '@/lib/admin-auth'

export default function AdminAppHeader({ title }: { title: string }) {
  const { logout } = useAdminAuth()
  const router = useRouter()

  function handleLogout() {
    logout()
    router.push('/admin-app')
  }

  return (
    <header className="sticky top-0 z-30 bg-green-900 border-b border-green-700 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-yellow-400 flex-shrink-0">
          <Image src="/admin-logo.png" alt="GGM&S" width={32} height={32} className="object-cover" />
        </div>
        <p className="font-extrabold text-white text-base">{title}</p>
      </div>
      <button onClick={handleLogout} className="text-green-300 p-1.5">
        <LogOut size={18} />
      </button>
    </header>
  )
}
