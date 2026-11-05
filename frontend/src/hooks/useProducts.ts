import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/products.api';
import { dashboardKeys } from './useDashboard';
import type {
  ProductQueryParams,
  CreateProductPayload,
  UpdateProductPayload,
  UploadImagePayload,
} from '../types/product.types';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params?: ProductQueryParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (slug: string) => [...productKeys.details(), slug] as const,
  adminLists: () => [...productKeys.all, 'admin-list'] as const,
  adminList: (params?: ProductQueryParams) => [...productKeys.adminLists(), params] as const,
  adminDetail: (id: string) => [...productKeys.all, 'admin-detail', id] as const,
};

/**
 * Public storefront products query
 */
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

/**
 * Public storefront product detail query by slug
 */
export function usePublicProductBySlug(slug: string) {
  return useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: () => productsApi.getPublicProductBySlug(slug),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Admin products listing query (all products, including inactive/drafts)
 */
export function useAdminProducts(params?: ProductQueryParams) {
  return useQuery({
    queryKey: productKeys.adminList(params),
    queryFn: () => productsApi.getAdminProducts(params),
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Admin product detail query by UUID
 */
export function useAdminProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.adminDetail(id || ''),
    queryFn: () => productsApi.getAdminProductById(id!),
    enabled: Boolean(id),
  });
}

/**
 * Mutation to create a new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductPayload) => productsApi.createAdminProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

/**
 * Mutation to update an existing product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProductPayload }) =>
      productsApi.updateAdminProduct(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.adminDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

/**
 * Mutation to archive / soft-delete a product (Admin only)
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.adminDetail(id) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

/**
 * Mutation to upload a product image
 */
export function useUploadProductImage() {
  return useMutation({
    mutationFn: (payload: UploadImagePayload) => productsApi.uploadProductImage(payload),
  });
}
