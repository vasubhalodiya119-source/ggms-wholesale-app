'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, Banknote, QrCode, BookUser, Download, Loader2, Package, Truck, Store } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Order, OrderItem, Settings } from '@/lib/types'
import { buildWhatsAppUrl } from '@/lib/receipt'

const paymentLabels: Record<string, { label: string; icon: typeof Banknote }> = {
  cash: { label: 'Cash / રોકડ', icon: Banknote },
  qr: { label: 'QR / UPI', icon: QrCode },
  udhar: { label: 'ઉધાર', icon: BookUser },
}

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [downloading, setDownloading] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.from('orders').select('*').eq('id', orderId).single().then(({ data }) => {
      setOrder(data as Order)
    })
    supabase.from('order_items').select('*').eq('order_id', orderId).then(({ data }) => {
      setItems((data as OrderItem[]) || [])
    })
    supabase.from('settings').select('*').eq('id', 1).single().then(({ data }) => {
      setSettings(data as Settings)
    })
  }, [orderId])

  async function downloadPdf() {
    if (!receiptRef.current) return
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      })
      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF({ unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
      pdf.save(`${order?.order_number || 'bill'}.pdf`)
    } finally {
      setDownloading(false)
    }
  }

  if (!order) return <div className="p-6 text-center text-sm text-slate-400">Loading...</div>

  const PayIcon = paymentLabels[order.payment_method]?.icon || Banknote
  const noteLines = (settings?.order_notes_gujarati || '').split('\n').filter((l) => l.trim())
  const numberCircles = ['1', '2', '3', '4', '5']

  return (
    <div className="px-4 pt-6 pb-8 max-w-md mx-auto space-y-4">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-3">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h1 className="text-lg font-extrabold text-slate-900">ઓર્ડર સફળતાપૂર્વક થયો!</h1>
        <p className="text-sm text-slate-400 mt-1">{order.order_number}</p>
      </div>

      {/* Receipt card — captured for PDF */}
      <div ref={receiptRef} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Package size={18} className="text-green-600" />
          <p className="font-extrabold text-slate-900 text-sm">
            NEW ORDER: {settings?.store_name || 'GGM&S Grocery'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {order.delivery_mode === 'pickup' ? (
            <Store size={16} className="text-slate-500" />
          ) : (
            <Truck size={16} className="text-slate-500" />
          )}
          <span className="text-slate-500">Delivery Mode:</span>
          <span className="font-bold text-slate-800">
            {order.delivery_mode === 'pickup' ? 'Pick Up at Store' : 'Shop Delivery'}
          </span>
        </div>

        <div>
          <p className="text-xs font-bold text-slate-400 uppercase mb-1.5">Customer Details</p>
          <p className="text-sm text-slate-700">• Name: <span className="font-bold">{order.shop_name_snapshot}</span></p>
          <p className="text-sm text-slate-700">• Phone: <span className="font-bold">91{order.shop_phone_snapshot}</span></p>
          {order.customer_address && (
            <p className="text-sm text-slate-700">• Address: <span className="font-bold">{order.customer_address}</span></p>
          )}
        </div>

        <div>
          <p className="text-xs font-bold text-slate-400 uppercase mb-1.5">Items Ordered</p>
          <div className="space-y-1.5">
            {items.map((item, idx) => (
              <p key={item.id} className="text-sm text-slate-700">
                {idx + 1}. {item.product_name_snapshot} ({item.qty} x {item.unit_snapshot}) -{' '}
                <span className="font-bold text-green-700">₹{item.line_total.toFixed(2)}</span>
              </p>
            ))}
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-3 flex justify-between items-center">
          <span className="font-bold text-slate-800 text-sm">💰 GRAND TOTAL</span>
          <span className="font-extrabold text-green-700 text-lg">₹{order.total_amount.toFixed(2)}</span>
        </div>

        {order.admin_reply && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-[11px] font-bold text-blue-600 uppercase mb-1">દુકાનદાર તરફથી જવાબ</p>
            <p className="text-sm text-blue-800">{order.admin_reply}</p>
          </div>
        )}

        {order.amount_due > 0 && (
          <div className="bg-red-50 rounded-xl p-3 flex justify-between items-center">
            <span className="font-bold text-red-600 text-sm">બાકી રકમ (Due)</span>
            <span className="font-extrabold text-red-600">₹{order.amount_due.toFixed(2)}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-sm">
          <PayIcon size={14} className="text-slate-500" />
          <span className="text-slate-500">Payment:</span>
          <span className="font-bold text-slate-800">{paymentLabels[order.payment_method]?.label}</span>
        </div>

        <p className="text-sm text-slate-600 text-center">Thank you for shopping with us! 🙏</p>

        {noteLines.length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-700 mb-2">📝 મહત્વની નોંધ:</p>
            <div className="space-y-2">
              {noteLines.map((line, idx) => {
                const cleaned = line.replace(/^[૦-૯0-9]+\.\s*/, '').trim()
                if (!cleaned) return null
                return (
                  <div key={idx} className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {numberCircles[idx] || idx + 1}
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">{cleaned}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={downloadPdf}
          disabled={downloading}
          className="bg-slate-900 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-sm disabled:opacity-60"
        >
          {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          PDF Download
        </button>
        <a
          href={buildWhatsAppUrl(order, items, settings)}
          target="_blank"
          className="bg-green-600 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-sm"
        >
          WhatsApp બિલ
        </a>
      </div>
    </div>
  )
}
