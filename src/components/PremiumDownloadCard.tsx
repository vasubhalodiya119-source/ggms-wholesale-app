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
    <div 
      className="relative overflow-hidden rounded-[20px] p-[1.5px] transition-all duration-300 min-h-[110px] flex hover:shadow-[0_8px_30px_rgba(255,220,80,0.25)]"
      style={{
        boxShadow: '0 8px 30px rgba(255, 220, 80, 0.18)'
      }}
    >
      {/* Local keyframes style for rotating border */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes border-spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}} />

      {/* Rotating conic gradient behind the inner card */}
      <div 
        className="absolute top-1/2 left-1/2 w-[300%] h-[300%] pointer-events-none"
        style={{
          background: 'conic-gradient(from 0deg, transparent 35%, #16A34A 50%, #BBF7D0 65%, #FFF6C2 80%, transparent 95%)',
          animation: 'border-spin 6s linear infinite'
        }}
      />

      {/* Inner Content Card */}
      <div 
        className="relative z-10 w-full rounded-[19px] p-3.5 sm:p-4 flex flex-row items-center justify-between gap-3 min-h-[107px]"
        style={{
          background: 'linear-gradient(to right, #FFFFFF 0%, #FFFDF3 25%, #FFF9D9 60%, #FFF6C2 100%)'
        }}
      >
        {/* Left Section: Text & Button */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
          <div className="space-y-0.5">
            <h3 className="text-slate-800 font-extrabold text-xs sm:text-sm md:text-[15px] leading-tight tracking-tight">
              Download Our Grocery App
            </h3>
            <p className="text-slate-500 font-medium text-[8px] sm:text-[9.5px] md:text-xs leading-none whitespace-nowrap">
              Fast Delivery • Fresh Products • Best Prices
            </p>
          </div>

          <div className="flex items-center">
            {downloadState === 'idle' && (
              <button
                onClick={handleDownloadClick}
                className="flex items-center justify-center gap-1 bg-[#16A34A] hover:bg-green-700 text-white font-bold text-[10px] sm:text-[11px] px-3.5 h-8 rounded-full transition-all duration-200 transform hover:scale-[1.03] active:scale-[0.98] shadow-sm shadow-green-600/10"
              >
                <Download size={13} className="animate-bounce" />
                <span>Download APK Now</span>
              </button>
            )}

            {downloadState === 'downloading' && (
              <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-full px-3.5 h-9 min-w-[170px] shadow-sm">
                <Loader2 size={13} className="animate-spin text-[#16A34A]" />
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-slate-500">
                    <span>Downloading...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-0.5 border border-slate-200/50">
                    <div 
                      className="bg-[#16A34A] h-full rounded-full transition-all duration-150 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {downloadState === 'completed' && (
              <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3.5 h-9 text-[#16A34A] font-bold text-xs sm:text-sm shadow-sm animate-pulse">
                <CheckCircle2 size={14} />
                <span>Download Started!</span>
                <button 
                  onClick={handleDownloadClick}
                  className="text-[9px] sm:text-xs text-slate-400 hover:text-slate-600 underline ml-1.5"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: QR Code & Helper Text */}
        <div className="hidden sm:flex flex-col items-center justify-center shrink-0">
          <div className="w-[72px] h-[72px] rounded-xl bg-white shadow-md border border-slate-100 flex items-center justify-center p-1.5 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            <QRCodeSVG value={appUrl} size={60} level="M" />
          </div>
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 text-center leading-tight mt-1.5">
            Scan QR
          </p>
        </div>
      </div>
      
    </div>
  )
}
