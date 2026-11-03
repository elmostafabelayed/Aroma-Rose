import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import type { Category } from '../types/product.types';

export const categoriesApi = {
  /**
   * Fetch active categories with product counts for storefront navigation
   */
  async getCategories(): Promise<Category[]> {
    const res = await apiClient.get<Category[]>(ENDPOINTS.PUBLIC_CATEGORIES.LIST);
    return res.data || [];
  },
};
