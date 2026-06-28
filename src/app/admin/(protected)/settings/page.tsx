'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Settings } from '@/lib/types'
import ImageUploadField from '@/components/ImageUploadField'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('settings').select('*').eq('id', 1).single().then(({ data }) => {
      setSettings(data as Settings)
    })
  }, [])

  async function handleSave() {
    if (!settings) return
    await supabase
      .from('settings')
      .update({
        headline_text: settings.headline_text,
        app_download_url: settings.app_download_url,
        app_qr_code_url: settings.app_qr_code_url,
        upi_qr_code_url: settings.upi_qr_code_url,
        store_name: settings.store_name,
        store_tagline: settings.store_tagline,
        low_stock_default_threshold: settings.low_stock_default_threshold,
        order_notes_gujarati: settings.order_notes_gujarati,
      })
      .eq('id', 1)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!settings) return <div className="p-6 text-sm text-slate-400">Loading...</div>

  return (
    <div className="p-5 max-w-2xl space-y-5">
      <h1 className="text-xl font-extrabold text-slate-900">Shop Settings</h1>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-bold text-slate-800">સ્ટોર માહિતી</h2>
        <div>
          <label className="text-xs font-bold text-slate-500">Store Name</label>
          <input
            value={settings.store_name}
            onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500">Tagline</label>
          <input
            value={settings.store_tagline}
            onChange={(e) => setSettings({ ...settings, store_tagline: e.target.value })}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mt-1"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-bold text-slate-800">હેડલાઈન (Scrolling Banner)</h2>
        <div>
          <label className="text-xs font-bold text-slate-500">Headline Text</label>
          <textarea
            value={settings.headline_text}
            onChange={(e) => setSettings({ ...settings, headline_text: e.target.value })}
            rows={2}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mt-1"
            placeholder="દા.ત. Bulk Order પર ખાસ ભાવ મેળવો!"
          />
          <p className="text-[11px] text-slate-400 mt-1">આ headline shopkeeper ની home screen પર scroll થશે</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-bold text-slate-800">મહત્વની નોંધ (Bill / WhatsApp Footer)</h2>
        <div>
          <label className="text-xs font-bold text-slate-500">Order Notes (દરેક line એક નોંધ)</label>
          <textarea
            value={settings.order_notes_gujarati}
            onChange={(e) => setSettings({ ...settings, order_notes_gujarati: e.target.value })}
            rows={5}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mt-1"
            placeholder="દરેક નોંધ નવી line પર લખો"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            આ notes દરેક bill (PDF + WhatsApp) ની નીચે દેખાશે. દરેક vaakya નવી લાઈન પર લખો.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-bold text-slate-800">App Download</h2>
        <div>
          <label className="text-xs font-bold text-slate-500">App Download URL (APK link)</label>
          <input
            value={settings.app_download_url || ''}
            onChange={(e) => setSettings({ ...settings, app_download_url: e.target.value })}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mt-1"
            placeholder="https://..."
          />
        </div>
        <ImageUploadField
          label="App QR Code"
          value={settings.app_qr_code_url}
          onChange={(url) => setSettings({ ...settings, app_qr_code_url: url })}
          hint="આ QR counter પર print કરીને રાખી શકાય - scan કરી app download/order કરી શકાય"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-bold text-slate-800">Payment QR (UPI)</h2>
        <ImageUploadField
          label="તમારો UPI QR Code"
          value={settings.upi_qr_code_url}
          onChange={(url) => setSettings({ ...settings, upi_qr_code_url: url })}
          hint="આ QR shopkeeper ને payment કરતી વખતે (QR/UPI પસંદ કરે ત્યારે) દેખાશે"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-bold text-slate-800">Low Stock Default</h2>
        <div>
          <label className="text-xs font-bold text-slate-500">Default Low Stock Threshold</label>
          <input
            type="number"
            value={settings.low_stock_default_threshold}
            onChange={(e) => setSettings({ ...settings, low_stock_default_threshold: parseFloat(e.target.value) || 0 })}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mt-1"
          />
          <p className="text-[11px] text-slate-400 mt-1">નવી product બનાવો ત્યારે default threshold</p>
        </div>
      </div>

      <button onClick={handleSave} className="w-full bg-green-600 text-white font-bold py-3.5 rounded-2xl">
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>
    </div>
  )
}
