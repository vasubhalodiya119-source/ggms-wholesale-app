'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ShoppingCart, Plus, Minus, Trash2, Banknote, QrCode, BookUser, Package } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { useShopAuth } from '@/lib/shop-auth'
import { supabase } from '@/lib/supabase'
import { PaymentMethod } from '@/lib/types'

const DELIVERY_FREE_THRESHOLD = 2000

export default function CartPage() {
  const { items, updateQty, removeItem, subtotal, clearCart } = useCart()
  const { shop } = useShopAuth()
  const router = useRouter()

  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'pickup'>('delivery')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [coupon, setCoupon] = useState('')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  const deliveryCharge = deliveryOption === 'delivery' && subtotal < DELIVERY_FREE_THRESHOLD && subtotal > 0 ? 30 : 0
  const grandTotal = subtotal + deliveryCharge

  async function placeOrder() {
    if (!shop) {
      router.push('/login?redirect=/cart')
      return
    }
    if (items.length === 0) return

    // Credit limit check for udhar
    if (paymentMethod === 'udhar' && shop.credit_limit > 0) {
      const projectedBalance = shop.current_balance + grandTotal
      if (projectedBalance > shop.credit_limit) {
        setError(
          `તમારી ઉધાર લિમિટ ₹${shop.credit_limit} છે. હાલની બાકી રકમ ₹${shop.current_balance} છે. આ ઓર્ડર પછી લિમિટ ક્રોસ થશે, કૃપા કરી દુકાનદારનો સંપર્ક કરો.`
        )
        return
      }
    }

    setPlacing(true)
    setError('')

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        shop_id: shop.id,
        shop_name_snapshot: shop.shop_name,
        shop_phone_snapshot: shop.phone,
        payment_method: paymentMethod,
        subtotal,
        total_amount: grandTotal,
        amount_paid: paymentMethod === 'udhar' ? 0 : grandTotal,
        status: 'pending',
      })
      .select()
      .single()

    if (orderErr || !order) {
      setError('ઓર્ડર કરવામાં ભૂલ થઈ, ફરી પ્રયત્ન કરો')
      setPlacing(false)
      return
    }

    const orderItems = items.map((i) => ({
      order_id: order.id,
      product_id: i.product.id,
      product_name_snapshot: i.product.name,
      price: i.product.price,
      qty: i.qty,
    }))

    await supabase.from('order_items').insert(orderItems)

    clearCart()
    router.push(`/orders/${order.id}`)
  }

  if (items.length === 0) {
    return (
      <div className="px-4 pt-3">
        <h2 className="text-lg font-extrabold text-slate-900 mb-1">Your Basket</h2>
        <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center text-center mt-2">
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mb-3">
            <ShoppingCart size={28} className="text-green-500" />
          </div>
          <p className="font-bold text-slate-800">Your Basket is Empty</p>
          <p className="text-sm text-slate-400 mt-1">
            Explore categories, select products, and they will show up here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-3 space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-slate-900">Your Basket</h2>
        <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
          {items.length} UNIQUE ITEMS
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        {items.map(({ product, qty }) => (
          <div key={product.id} className="p-3 flex gap-3 items-center">
            <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden relative flex-shrink-0">
              {product.image_url ? (
                <Image src={product.image_url} alt={product.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Package size={20} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{product.name}</p>
              <p className="text-green-700 font-extrabold text-sm">₹{product.price}</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-2 py-1.5">
              <button onClick={() => updateQty(product.id, qty - 1)} className="text-slate-600">
                <Minus size={14} />
              </button>
              <span className="font-bold text-sm w-5 text-center">{qty}</span>
              <button onClick={() => updateQty(product.id, qty + 1)} className="text-slate-600">
                <Plus size={14} />
              </button>
            </div>
            <button onClick={() => removeItem(product.id)} className="text-red-400 p-1">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Coupon */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <p className="text-xs font-bold text-slate-400 mb-2">APPLY COUPON / કૂપન કોડ</p>
        <div className="flex gap-2">
          <input
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            placeholder="દા.ત. FIRSTORDER"
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
          />
          <button className="bg-slate-900 text-white text-sm font-bold px-4 rounded-xl">APPLY</button>
        </div>
      </div>

      {/* Order pricing */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
        <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full inline-block mb-1">
          ORDER PRICING
        </span>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Subtotal</span>
          <span className="font-bold text-slate-800">₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-green-600 font-semibold">Delivery Charge</span>
          {deliveryCharge === 0 ? (
            <span className="text-xs font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full">FREE</span>
          ) : (
            <span className="font-bold text-slate-800">₹{deliveryCharge}</span>
          )}
        </div>
        <div className="flex justify-between text-base pt-2 border-t border-slate-100">
          <span className="font-bold text-slate-900">Grand Total</span>
          <span className="font-extrabold text-slate-900">₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Delivery option */}
      <div>
        <p className="text-sm font-bold text-slate-800 mb-2">DELIVERY OPTION / ડિલિવરી વિકલ્પ</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setDeliveryOption('delivery')}
            className={`bg-white rounded-2xl border p-3 flex flex-col items-center gap-1.5 ${
              deliveryOption === 'delivery' ? 'border-green-500 ring-2 ring-green-100' : 'border-slate-200'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
              <Package size={16} />
            </div>
            <span className="text-xs font-bold text-slate-700">HOME DELIVERY</span>
            <span className="text-[10px] text-orange-500 font-semibold">₹2000+ જરૂરી</span>
          </button>
          <button
            onClick={() => setDeliveryOption('pickup')}
            className={`bg-white rounded-2xl border p-3 flex flex-col items-center gap-1.5 ${
              deliveryOption === 'pickup' ? 'border-green-500 ring-2 ring-green-100' : 'border-slate-200'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
              <Package size={16} />
            </div>
            <span className="text-xs font-bold text-slate-700">PICK UP AT STORE</span>
            <span className="text-[10px] text-slate-400">દુકાનેથી લઈ જાવ</span>
          </button>
        </div>
      </div>

      {/* Payment method */}
      <div>
        <p className="text-sm font-bold text-slate-800 mb-2">PAYMENT METHOD / ચુકવણી પદ્ધતિ</p>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => setPaymentMethod('cash')}
            className={`bg-white rounded-2xl border p-3 flex flex-col items-center gap-1.5 ${
              paymentMethod === 'cash' ? 'border-green-500 ring-2 ring-green-100' : 'border-slate-200'
            }`}
          >
            <Banknote size={20} className={paymentMethod === 'cash' ? 'text-green-600' : 'text-slate-400'} />
            <span className="text-[11px] font-bold text-slate-700">CASH</span>
          </button>
          <button
            onClick={() => setPaymentMethod('qr')}
            className={`bg-white rounded-2xl border p-3 flex flex-col items-center gap-1.5 ${
              paymentMethod === 'qr' ? 'border-green-500 ring-2 ring-green-100' : 'border-slate-200'
            }`}
          >
            <QrCode size={20} className={paymentMethod === 'qr' ? 'text-green-600' : 'text-slate-400'} />
            <span className="text-[11px] font-bold text-slate-700">QR / UPI</span>
          </button>
          <button
            onClick={() => setPaymentMethod('udhar')}
            className={`bg-white rounded-2xl border p-3 flex flex-col items-center gap-1.5 ${
              paymentMethod === 'udhar' ? 'border-green-500 ring-2 ring-green-100' : 'border-slate-200'
            }`}
          >
            <BookUser size={20} className={paymentMethod === 'udhar' ? 'text-green-600' : 'text-slate-400'} />
            <span className="text-[11px] font-bold text-slate-700">ઉધાર</span>
          </button>
        </div>
        {paymentMethod === 'udhar' && shop && (
          <p className="text-[11px] text-slate-400 mt-2 px-1">
            હાલની બાકી રકમ: ₹{shop.current_balance} {shop.credit_limit > 0 && `/ લિમિટ: ₹${shop.credit_limit}`}
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl p-3">
          {error}
        </div>
      )}

      {!shop && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-xl p-3">
          ઓર્ડર કરવા માટે પહેલા લોગિન કરો - દુકાનનું નામ અને નંબર જરૂરી છે
        </div>
      )}

      <button
        onClick={placeOrder}
        disabled={placing}
        className="w-full bg-green-600 text-white font-bold py-3.5 rounded-2xl shadow-sm disabled:opacity-60"
      >
        {placing ? 'ઓર્ડર થઈ રહ્યો છે...' : `ઓર્ડર કરો • ₹${grandTotal.toFixed(2)}`}
      </button>
    </div>
  )
}
