import { Order, OrderItem, Settings } from './types'

export function buildWhatsAppMessage(order: Order, items: OrderItem[], settings: Settings | null): string {
  const deliveryLabel = order.delivery_mode === 'pickup' ? '🏠 Pick Up at Store' : '🚚 Home Delivery'

  let msg = `📦 *NEW ORDER: ${settings?.store_name || 'GGM&S Grocery'}*\n\n`
  msg += `📋 Delivery Mode: ${deliveryLabel}\n\n`
  msg += `👤 *Customer Details:*\n`
  msg += `• Name: ${order.shop_name_snapshot}\n`
  msg += `• Phone: 91${order.shop_phone_snapshot}\n`
  if (order.customer_address) msg += `• Address: ${order.customer_address}\n`
  msg += `\n🛒 *Items Ordered:*\n`

  items.forEach((item, idx) => {
    msg += `${idx + 1}. ${item.product_name_snapshot} (${item.qty} x ${item.unit_snapshot}) - ₹${item.line_total.toFixed(2)}\n`
  })

  msg += `\n💰 *GRAND TOTAL: ₹${order.total_amount.toFixed(2)}*\n`

  if (order.payment_method === 'udhar') {
    msg += `💳 Payment: ઉધાર (Due: ₹${order.amount_due.toFixed(2)})\n`
  } else if (order.amount_due > 0) {
    msg += `💳 Due Amount: ₹${order.amount_due.toFixed(2)}\n`
  }

  msg += `\nThank you for shopping with us! 🙏\n`
  msg += `─────────────────\n`
  msg += `📝 *મહત્વની નોંધ:*\n\n`

  const notes = settings?.order_notes_gujarati || ''
  const noteLines = notes.split('\n').filter((l) => l.trim())
  const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']
  let noteIdx = 0
  noteLines.forEach((line) => {
    const cleaned = line.replace(/^[૦-૯0-9]+\.\s*/, '').trim()
    if (cleaned) {
      msg += `${numberEmojis[noteIdx] || '▪️'} ${cleaned}\n\n`
      noteIdx++
    }
  })

  return msg
}

export function buildWhatsAppUrl(order: Order, items: OrderItem[], settings: Settings | null): string {
  const message = buildWhatsAppMessage(order, items, settings)
  return `https://wa.me/91${order.shop_phone_snapshot}?text=${encodeURIComponent(message)}`
}
