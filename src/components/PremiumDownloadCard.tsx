'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'
import { 
  Download, 
  CheckCircle2, 
  Loader2, 
  QrCode, 
  ShieldCheck, 
  FileDown
} from 'lucide-react'

type PremiumDownloadCardProps = {
  downloadUrl: string | null
  appUrl: string
}

export function PremiumDownloadCard({ downloadUrl, appUrl }: PremiumDownloadCardProps) {
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'completed'>('idle')
  const [progress, setProgress] = useState(0)
  const [showQR, setShowQR] = useState(false)

  const finalDownloadUrl = downloadUrl || `${appUrl}/GGMS-Wholesale.apk`

  // Handle fake download progress animation
  useEffect(() => {
    if (downloadState !== 'downloading') return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setDownloadState('completed')
            // Trigger actual download in browser
            window.location.href = finalDownloadUrl
          }, 300)
          return 100
        }
        // Accelerate/decelerate realistically
        const increment = prev < 30 ? 12 : prev < 70 ? 8 : 15
        return Math.min(prev + increment, 100)
      })
    }, 150)

    return () => clearInterval(interval)
  }, [downloadState, finalDownloadUrl])

  const handleDownloadClick = () => {
    setProgress(0)
    setDownloadState('downloading')
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900/95 border border-slate-700/50 p-6 text-white shadow-2xl transition-all duration-300 hover:shadow-emerald-500/10">
      
      {/* Background ambient glows */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-5">
        
        {/* App Title Section */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white overflow-hidden shadow-lg border border-slate-200 p-0.5">
              <Image src="/logo.png" alt="GGM&S Logo" width={52} height={52} className="object-contain" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent">
                GGM&S Wholesale App
              </h3>
            </div>
          </div>

          {/* QR Toggle Button */}
          <button 
            onClick={() => setShowQR(!showQR)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700/80 transition-colors shadow-sm"
            title="Scan QR Code to download"
          >
            <QrCode size={18} className="text-slate-300 hover:text-emerald-400 transition-colors" />
          </button>
        </div>

        {/* QR Code Container (Collapsible) */}
        {showQR && (
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-800 shadow-inner animate-fadeIn">
            <QRCodeSVG value={appUrl} size={150} level="M" />
            <p className="text-[11px] text-slate-500 mt-2 font-bold text-center">
              બીજા ફોનમાં એપ ડાઉનલોડ કરવા QR સ્કેન કરો
            </p>
          </div>
        )}

        {/* Info/Features Tags */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-800/50 rounded-xl px-3 py-2 border border-slate-800">
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            <span className="text-slate-300 font-medium truncate">100% Safe & Secure</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800/50 rounded-xl px-3 py-2 border border-slate-800">
            <FileDown size={14} className="text-teal-400 shrink-0" />
            <span className="text-slate-300 font-medium truncate">Fast Download (~5MB)</span>
          </div>
        </div>

        {/* Download Call To Action */}
        <div className="space-y-3">
          {downloadState === 'idle' && (
            <button
              onClick={handleDownloadClick}
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 font-extrabold text-sm py-4 tracking-wide shadow-lg shadow-emerald-900/30 transition-transform active:scale-[0.98] hover:shadow-emerald-500/20"
            >
              {/* Button shimmer effect */}
              <div className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-12 -translate-x-full group-hover:animate-shimmer" />
              
              <div className="flex items-center justify-center gap-2">
                <Download size={18} className="animate-bounce" />
                <span>DOWNLOAD APK</span>
              </div>
            </button>
          )}

          {downloadState === 'downloading' && (
            <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <Loader2 size={14} className="animate-spin" />
                  ડાઉનલોડ થઈ રહ્યું છે...
                </span>
                <span className="font-extrabold text-slate-300">{progress}%</span>
              </div>
              <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)] transition-all duration-150 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 text-center font-medium">
                ડાઉનલોડ પૂર્ણ થતાં જ ફાઇલ ઓપન કરવાનો ઓપ્શન આવશે.
              </p>
            </div>
          )}

          {downloadState === 'completed' && (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl py-3 px-4 text-emerald-400">
                <CheckCircle2 size={18} className="shrink-0" />
                <span className="text-xs font-bold">ડાઉનલોડ શરૂ થઈ ગયું છે!</span>
              </div>
              
              <button
                onClick={handleDownloadClick}
                className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors py-1.5 font-semibold underline"
              >
                ફરીથી ડાઉનલોડ કરવા ક્લિક કરો
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
