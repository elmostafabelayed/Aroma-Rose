export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  city: string;
  address: string;
  postal_code?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  total_orders: number;
  total_spent: string | number;
  last_order_date?: string | null;
  first_order_date?: string | null;
  last_order_source?: 'website' | 'whatsapp' | string | null;
  last_order_status?: string | null;
}

export interface CustomerSummary {
  total_customers: number;
  active_customers: number;
  inactive_customers: number;
  repeat_customers: number;
  total_revenue: string | number;
}

export interface CustomerOrder {
  id: string;
  order_number: string;
  order_source: 'website' | 'whatsapp';
  status: string;
  payment_method: string;
  payment_status: string;
  total_amount: string | number;
  created_at: string;
  items_count: number;
}

export interface CustomerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | 'active' | 'inactive' | 'repeat';
  city?: string;
}

export interface CustomersMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  summary?: CustomerSummary;
}

export interface CustomersResponseData {
  customers: Customer[];
  meta: CustomersMeta;
}
