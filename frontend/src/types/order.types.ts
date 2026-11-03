export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
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
  created_at: string;
  total_orders?: number;
  total_spent?: number;
}

export interface OrderItemInput {
  product_id: string;
  quantity: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  source: OrderSource;
  status: OrderStatus;
  payment_method: 'cod';
  payment_status: PaymentStatus;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
  customer_notes?: string | null;
  admin_notes?: string | null;
  created_by_profile_id?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  customer?: Customer;
  items?: OrderItem[];
}

export interface GuestCheckoutPayload {
  customer: CustomerInput;
  items: OrderItemInput[];
  customer_notes?: string | null;
}

