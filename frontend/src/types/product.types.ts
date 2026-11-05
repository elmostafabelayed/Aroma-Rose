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
  cost_price?: number | null;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  category?: ProductCategoryRef | null;
  category_id?: string | null;
  primary_image?: ProductImage | null;
  images?: ProductImage[];
  images_count?: number;
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
  status?: 'all' | 'active' | 'inactive';
  stock_status?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  min_price?: number;
  max_price?: number;
  sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'created_desc';
}

export interface CreateProductPayload {
  name: string;
  slug: string;
  sku?: string;
  category_id?: string | null;
  description?: string;
  price: number;
  compare_at_price?: number | null;
  cost_price?: number | null;
  stock_quantity: number;
  is_active: boolean;
  images?: ProductImage[];
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

export interface UploadImagePayload {
  file_name: string;
  content_type: string;
  file_base64: string;
}

export interface UploadImageResponse {
  storage_path: string;
  public_url: string;
}
