import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../api/products.api';
import type { ProductQueryParams } from '../types/product.types';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params?: ProductQueryParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (slug: string) => [...productKeys.details(), slug] as const,
  adminLists: () => [...productKeys.all, 'admin-list'] as const,
  adminList: (params?: ProductQueryParams) => [...productKeys.adminLists(), params] as const,
};

export function usePublicProducts(
  params?: ProductQueryParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productsApi.getPublicProducts(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: options?.enabled !== undefined ? options.enabled : true,
  });
}

export function usePublicProductBySlug(slug: string) {
  return useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: () => productsApi.getPublicProductBySlug(slug),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAdminProducts(params?: ProductQueryParams) {
  return useQuery({
    queryKey: productKeys.adminList(params),
    queryFn: () => productsApi.getAdminProducts(params),
    staleTime: 1000 * 60 * 2,
  });
}

