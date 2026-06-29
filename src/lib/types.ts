export type Shop = {
  id: string
  shop_name: string
  owner_name: string | null
  phone: string
  password: string | null
  address: string | null
  credit_limit: number
  current_balance: number
  is_active: boolean
  created_at: string
}

export type Category = {
  id: string
  name: string
  name_gujarati: string | null
  image_url: string | null
  sort_order: number
  created_at: string
}

export type Product = {
  id: string
  category_id: string | null
  name: string
  name_gujarati: string | null
  image_url: string | null
  price: number
  unit: string
  stock_qty: number
  low_stock_threshold: number
  is_active: boolean
  created_at: string
}

export type PaymentMethod = 'cash' | 'qr' | 'udhar'
export type OrderStatus = 'pending' | 'processing' | 'delivered' | 'cancelled'

export type Order = {
  id: string
  order_number: string
  shop_id: string | null
  shop_name_snapshot: string | null
  shop_phone_snapshot: string | null
  payment_method: PaymentMethod
  delivery_mode: 'home_delivery' | 'pickup'
  customer_address: string | null
  subtotal: number
  total_amount: number
  amount_paid: number
  amount_due: number
  status: OrderStatus
  created_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string | null
  product_name_snapshot: string | null
  unit_snapshot: string
  price: number
  qty: number
  line_total: number
}

export type CartItem = {
  product: Product
  qty: number
}

export type Settings = {
  id: number
  headline_text: string
  app_download_url: string | null
  app_qr_code_url: string | null
  upi_qr_code_url: string | null
  store_name: string
  store_tagline: string
  low_stock_default_threshold: number
  order_notes_gujarati: string
}

export type Admin = {
  id: string
  name: string
  phone: string
  password: string | null
  created_at: string
}

export type Broadcast = {
  id: string
  message: string
  created_at: string
}

export type DailyRate = {
  id: string
  item_name: string
  item_name_gujarati: string | null
  rate: number
  unit: string
  sort_order: number
  updated_at: string
}
