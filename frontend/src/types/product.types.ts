export interface ProductImage {
  id?: string;
  storage_path: string;
  alt_text?: string | null;
  display_order?: number;
  is_primary?: boolean;
  public_url?: string;
}

export interface ProductCategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description?: string | null;
  price: number;
  compare_at_price?: number | null;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  category?: ProductCategoryRef | null;
  primary_image?: ProductImage | null;
  images?: ProductImage[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  display_order: number;
  products_count: number;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'created_desc';
}

