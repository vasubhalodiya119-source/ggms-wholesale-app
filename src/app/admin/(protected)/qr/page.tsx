'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AdminCounterQRPage() {
  const [siteUrl, setSiteUrl] = useState('')

  useEffect(() => {
    setSiteUrl(window.location.origin)
  }, [])

  function downloadQR() {
    const svg = document.getElementById('counter-qr')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 600
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx?.fillRect(0, 0, 600, 600)
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 600, 600)
        ctx.drawImage(img, 50, 50, 500, 500)
      }
      const link = document.createElement('a')
      link.download = 'GGMS-Counter-QR.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  return (
    <div className="p-5 max-w-lg space-y-5">
      <h1 className="text-xl font-extrabold text-slate-900">Counter QR</h1>
      <p className="text-sm text-slate-500">
        આ QR code ને print કરીને counter પર રાખો. કોઈપણ shopkeeper scan કરીને directly app ખોલી, login/order કરી શકશે.
      </p>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center">
        {siteUrl && (
          <div className="bg-white p-4 border-2 border-slate-100 rounded-2xl">
            <QRCodeSVG id="counter-qr" value={siteUrl} size={220} level="H" />
          </div>
        )}
        <p className="text-sm font-bold text-slate-800 mt-4">GGM&amp;S Wholesale</p>
        <p className="text-xs text-slate-400">Scan કરીને ઓર્ડર કરો</p>
        <p className="text-[11px] text-slate-300 mt-1 break-all">{siteUrl}</p>

        <button
          onClick={downloadQR}
          className="mt-5 bg-green-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-2"
        >
          <Download size={16} /> Download QR (PNG)
        </button>
      </div>
    </div>
  )
}
