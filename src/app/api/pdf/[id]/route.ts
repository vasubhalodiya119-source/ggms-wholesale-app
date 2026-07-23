import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsPDF } from 'jspdf'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // 1. Fetch Order details
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 2. Fetch Order Items
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    // 3. Fetch Settings
    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single()

    // 4. Generate PDF using jsPDF
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    let y = 15

    // Store Header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(22, 163, 74) // #16a34a
    const storeName = settings?.store_name || 'GGM&S Wholesale Grocery'
    doc.text(storeName, pageWidth / 2, y, { align: 'center' })
    y += 7

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text('Wholesale & Bulk Order Invoice', pageWidth / 2, y, { align: 'center' })
    y += 10

    // Divider
    doc.setDrawColor(226, 232, 240)
    doc.line(15, y, pageWidth - 15, y)
    y += 8

    // Order & Customer Info
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(`Order Number: ${order.order_number}`, 15, y)

    const dateStr = new Date(order.created_at).toLocaleString('en-IN')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(`Date: ${dateStr}`, pageWidth - 15, y, { align: 'right' })
    y += 7

    doc.setFontSize(10)
    doc.setTextColor(51, 65, 85)
    doc.text(`Customer / Shop: ${order.shop_name_snapshot}`, 15, y)
    y += 5
    doc.text(`Phone: +91 ${order.shop_phone_snapshot}`, 15, y)
    y += 5
    if (order.customer_address) {
      doc.text(`Address: ${order.customer_address}`, 15, y)
      y += 5
    }
    doc.text(`Delivery Mode: ${order.delivery_mode === 'pickup' ? 'Pick Up at Store' : 'Shop Delivery'}`, 15, y)
    y += 5
    doc.text(`Payment Method: ${order.payment_method?.toUpperCase() || 'CASH'}`, 15, y)
    y += 10

    // Items Table Header
    doc.setFillColor(241, 245, 249)
    doc.rect(15, y, pageWidth - 30, 8, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)
    doc.text('#', 18, y + 5.5)
    doc.text('Item Description', 28, y + 5.5)
    doc.text('Qty x Unit', 125, y + 5.5)
    doc.text('Price', 155, y + 5.5)
    doc.text('Total (INR)', pageWidth - 18, y + 5.5, { align: 'right' })
    y += 10

    // Items List
    doc.setFont('helvetica', 'normal')
    ;(items || []).forEach((item: any, idx: number) => {
      if (y > 270) {
        doc.addPage()
        y = 15
      }
      const itemTotal = item.line_total || (item.qty * item.price)
      doc.text(String(idx + 1), 18, y)
      doc.text(String(item.product_name_snapshot).slice(0, 45), 28, y)
      doc.text(`${item.qty} x ${item.unit_snapshot}`, 125, y)
      doc.text(`Rs. ${item.price.toFixed(2)}`, 155, y)
      doc.text(`Rs. ${itemTotal.toFixed(2)}`, pageWidth - 18, y, { align: 'right' })
      y += 6
    })

    y += 2
    doc.setDrawColor(226, 232, 240)
    doc.line(15, y, pageWidth - 15, y)
    y += 8

    // Grand Total
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text('GRAND TOTAL:', 125, y)
    doc.setTextColor(22, 163, 74)
    doc.text(`Rs. ${order.total_amount.toFixed(2)}`, pageWidth - 18, y, { align: 'right' })
    y += 6

    if (order.amount_due > 0) {
      doc.setFontSize(10)
      doc.setTextColor(220, 38, 38)
      doc.text('Amount Due:', 125, y)
      doc.text(`Rs. ${order.amount_due.toFixed(2)}`, pageWidth - 18, y, { align: 'right' })
      y += 6
    }

    y += 10
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text('Thank you for shopping with us!', pageWidth / 2, y, { align: 'center' })

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    const fileName = `${order.order_number || 'Order-Invoice'}.pdf`

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (err: any) {
    console.error('PDF Server Route Error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate PDF' }, { status: 500 })
  }
}
