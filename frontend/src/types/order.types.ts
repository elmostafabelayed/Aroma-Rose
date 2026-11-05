export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'pending' | 'failed';
export type OrderSource = 'website' | 'whatsapp';

export interface CustomerInput {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  city: string;
  address: string;
  postal_code?: string | null;
  notes?: string | null;
}

export interface Customer extends CustomerInput {
  id: string;
  created_at?: string;
  total_orders?: number;
  total_spent?: number;
}

export interface OrderItemInput {
  product_id: string;
  quantity: number;
}

export interface OrderItemImage {
  storage_path: string;
  alt_text?: string | null;
}

export interface OrderItem {
  id: string;
  order_id?: string;
  product_id: string;
  product_name_snapshot?: string;
  product_name?: string;
  product_sku_snapshot?: string;
  product_sku?: string;
  unit_price_snapshot?: number;
  unit_price?: number;
  quantity: number;
  total_price: number;
  product_image?: OrderItemImage | null;
}

export interface OrderStatusHistoryItem {
  id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  notes?: string | null;
  created_at: string;
  changed_by?: {
    id: string;
    full_name: string;
  } | null;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  source?: OrderSource;
  order_source?: OrderSource;
  status: OrderStatus;
  payment_method: 'cod';
  payment_status: PaymentStatus;
  subtotal: number;
  shipping_fee: number;
  discount_amount?: number;
  total_amount: number;
  shipping_city?: string;
  shipping_address?: string;
  shipping_phone?: string;
  customer_notes?: string | null;
  admin_notes?: string | null;
  created_by_profile_id?: string | null;
  created_by_profile?: {
    id: string;
    full_name: string;
    role: string;
  } | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  updated_at?: string;
  customer?: Customer;
  items?: OrderItem[];
  items_count?: number;
  status_history?: OrderStatusHistoryItem[];
}

export interface GuestCheckoutPayload {
  customer: CustomerInput;
  items: OrderItemInput[];
  customer_notes?: string | null;
}

export interface AdminWhatsAppOrderPayload {
  customer: CustomerInput;
  items: OrderItemInput[];
  shipping_fee?: number;
  customer_notes?: string | null;
  admin_notes?: string | null;
}

export interface AdminOrderQueryParams {
  status?: OrderStatus;
  order_source?: OrderSource;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}
