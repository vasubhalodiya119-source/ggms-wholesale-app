'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Loader2, CheckCircle2 } from 'lucide-react'

type PremiumDownloadCardProps = {
  downloadUrl: string | null
  appUrl: string
}

export function PremiumDownloadCard({ downloadUrl, appUrl }: PremiumDownloadCardProps) {
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'completed'>('idle')
  const [progress, setProgress] = useState(0)

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
    <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-r from-white to-[#FFF9D9] border border-green-100/50 p-6 shadow-[0_8px_30px_rgba(22,163,74,0.06)] transition-all duration-300 md:h-[140px] flex flex-col md:flex-row md:items-center md:justify-between gap-6 hover:shadow-[0_8px_30px_rgba(22,163,74,0.1)]">
      
      {/* Left Section: Text & Button */}
      <div className="flex-1 flex flex-col justify-between h-full gap-4 md:gap-2">
        <div className="space-y-1">
          <h3 className="text-slate-800 font-extrabold text-base md:text-lg leading-tight tracking-tight">
            Download Our Grocery App
          </h3>
          <p className="text-slate-500 font-medium text-xs md:text-sm leading-none">
            Fast Delivery • Fresh Products • Best Prices
          </p>
          <p className="text-slate-400 font-medium text-[10px] md:text-xs">
            QR scan કરો અથવા નીચે button દબાવો
          </p>
        </div>

        <div className="flex items-center">
          {downloadState === 'idle' && (
            <button
              onClick={handleDownloadClick}
              className="flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-green-700 text-white font-bold text-xs md:text-sm px-6 h-10 md:h-12 rounded-full transition-all duration-200 transform hover:scale-[1.03] active:scale-[0.98] shadow-md shadow-green-600/10"
            >
              <Download size={16} className="animate-bounce" />
              <span>Download APK Now</span>
            </button>
          )}

          {downloadState === 'downloading' && (
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-full px-4 h-10 md:h-12 min-w-[200px] shadow-sm">
              <Loader2 size={16} className="animate-spin text-[#16A34A]" />
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                  <span>Downloading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-0.5 border border-slate-200/50">
                  <div 
                    className="bg-[#16A34A] h-full rounded-full transition-all duration-150 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {downloadState === 'completed' && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-5 h-10 md:h-12 text-[#16A34A] font-bold text-xs md:text-sm shadow-sm animate-pulse">
              <CheckCircle2 size={16} />
              <span>Download Started!</span>
              <button 
                onClick={handleDownloadClick}
                className="text-[10px] text-slate-400 hover:text-slate-600 underline ml-2"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Section: QR Code */}
      <div className="flex justify-center items-center shrink-0">
        <div className="w-[100px] h-[100px] rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center p-2 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
          <QRCodeSVG value={appUrl} size={84} level="M" />
        </div>
      </div>
      
    </div>
  )
}
