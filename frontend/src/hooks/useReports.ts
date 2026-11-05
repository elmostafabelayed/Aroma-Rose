import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reports.api';
import type { ReportDateRangeParams } from '../types/reports.types';

export const reportKeys = {
  all: ['admin', 'reports'] as const,
  summary: (params?: ReportDateRangeParams) => [...reportKeys.all, 'summary', params] as const,
  sales: (params?: ReportDateRangeParams) => [...reportKeys.all, 'sales', params] as const,
  orders: (params?: ReportDateRangeParams) => [...reportKeys.all, 'orders', params] as const,
  products: (params?: ReportDateRangeParams) => [...reportKeys.all, 'products', params] as const,
  categories: (params?: ReportDateRangeParams) => [...reportKeys.all, 'categories', params] as const,
  collections: (params?: ReportDateRangeParams) => [...reportKeys.all, 'collections', params] as const,
  customers: (params?: ReportDateRangeParams) => [...reportKeys.all, 'customers', params] as const,
  delivery: (params?: ReportDateRangeParams) => [...reportKeys.all, 'delivery', params] as const,
};

export function useReportSummary(params?: ReportDateRangeParams) {
  return useQuery({
    queryKey: reportKeys.summary(params),
    queryFn: () => reportsApi.getSummary(params),
    staleTime: 60 * 1000,
  });
}

export function useReportSales(params?: ReportDateRangeParams) {
  return useQuery({
    queryKey: reportKeys.sales(params),
    queryFn: () => reportsApi.getSales(params),
    staleTime: 60 * 1000,
  });
}

export function useReportOrders(params?: ReportDateRangeParams) {
  return useQuery({
    queryKey: reportKeys.orders(params),
    queryFn: () => reportsApi.getOrders(params),
    staleTime: 60 * 1000,
  });
}

export function useReportProducts(params?: ReportDateRangeParams) {
  return useQuery({
    queryKey: reportKeys.products(params),
    queryFn: () => reportsApi.getProducts(params),
    staleTime: 60 * 1000,
  });
}

export function useReportCategories(params?: ReportDateRangeParams) {
  return useQuery({
    queryKey: reportKeys.categories(params),
    queryFn: () => reportsApi.getCategories(params),
    staleTime: 60 * 1000,
  });
}

export function useReportCollections(params?: ReportDateRangeParams) {
  return useQuery({
    queryKey: reportKeys.collections(params),
    queryFn: () => reportsApi.getCollections(params),
    staleTime: 60 * 1000,
  });
}

export function useReportCustomers(params?: ReportDateRangeParams) {
  return useQuery({
    queryKey: reportKeys.customers(params),
    queryFn: () => reportsApi.getCustomers(params),
    staleTime: 60 * 1000,
  });
}

export function useReportDelivery(params?: ReportDateRangeParams) {
  return useQuery({
    queryKey: reportKeys.delivery(params),
    queryFn: () => reportsApi.getDelivery(params),
    staleTime: 60 * 1000,
  });
}
