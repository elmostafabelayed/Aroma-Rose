import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import type {
  Product,
  ProductQueryParams,
  CreateProductPayload,
  UpdateProductPayload,
  UploadImagePayload,
  UploadImageResponse,
} from '../types/product.types';
import type { PaginatedMeta } from '../types/api.types';

export const productsApi = {
  /**
   * Fetch active products for public storefront
   */
  async getPublicProducts(params?: ProductQueryParams): Promise<{ products: Product[]; meta?: PaginatedMeta }> {
    const res = await apiClient.get<Product[]>(
      ENDPOINTS.PUBLIC_PRODUCTS.LIST,
      params as Record<string, string | number | undefined>
    );
    return {
      products: res.data || [],
      meta: res.meta,
    };
  },

  /**
   * Fetch single active product by slug for product detail page
   */
  async getPublicProductBySlug(slug: string): Promise<Product> {
    const res = await apiClient.get<Product>(ENDPOINTS.PUBLIC_PRODUCTS.BY_SLUG(slug));
    return res.data;
  },

  /**
   * Fetch admin products list (with inactive and stock levels)
   */
  async getAdminProducts(params?: ProductQueryParams): Promise<{ products: Product[]; meta?: PaginatedMeta }> {
    const res = await apiClient.get<Product[]>(
      ENDPOINTS.ADMIN_PRODUCTS.LIST,
      params as Record<string, string | number | undefined>
    );
    return {
      products: res.data || [],
      meta: res.meta,
    };
  },

  /**
   * Fetch admin product by ID
   */
  async getAdminProductById(id: string): Promise<Product> {
    const res = await apiClient.get<Product>(ENDPOINTS.ADMIN_PRODUCTS.BY_ID(id));
    return res.data;
  },

  /**
   * Create admin product
   */
  async createAdminProduct(payload: CreateProductPayload): Promise<Product> {
    const res = await apiClient.post<Product>(ENDPOINTS.ADMIN_PRODUCTS.CREATE, payload);
    return res.data;
  },

  /**
   * Update admin product
   */
  async updateAdminProduct(id: string, payload: UpdateProductPayload): Promise<Product> {
    const res = await apiClient.patch<Product>(ENDPOINTS.ADMIN_PRODUCTS.UPDATE(id), payload);
    return res.data;
  },

  /**
   * Soft-delete / Archive product (Admin only)
   */
  async deleteProduct(id: string): Promise<{ message: string; product: Product }> {
    const res = await apiClient.delete<{ message: string; product: Product }>(
      ENDPOINTS.ADMIN_PRODUCTS.DELETE(id)
    );
    return res.data;
  },

  /**
   * Upload product image via backend storage handler
   */
  async uploadProductImage(payload: UploadImagePayload): Promise<UploadImageResponse> {
    const res = await apiClient.post<UploadImageResponse>(
      ENDPOINTS.ADMIN_PRODUCTS.UPLOAD_IMAGE,
      payload
    );
    return res.data;
  },
};
