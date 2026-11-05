import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import type {
  ReportDateRangeParams,
  ReportSummaryData,
  ReportSalesData,
  ReportOrdersData,
  ReportProductsData,
  ReportCategoriesData,
  CollectionAnalyticsData,
  CustomerAnalyticsData,
  DeliveryAnalyticsData,
} from '../types/reports.types';

export const reportsApi = {
  getSummary: (params?: ReportDateRangeParams) =>
    apiClient
      .get<ReportSummaryData>(ENDPOINTS.ADMIN_REPORTS.SUMMARY, params as Record<string, string | number | boolean | null | undefined>)
      .then((res) => res.data),

  getSales: (params?: ReportDateRangeParams) =>
    apiClient
      .get<ReportSalesData>(ENDPOINTS.ADMIN_REPORTS.SALES, params as Record<string, string | number | boolean | null | undefined>)
      .then((res) => res.data),

  getOrders: (params?: ReportDateRangeParams) =>
    apiClient
      .get<ReportOrdersData>(ENDPOINTS.ADMIN_REPORTS.ORDERS, params as Record<string, string | number | boolean | null | undefined>)
      .then((res) => res.data),

  getProducts: (params?: ReportDateRangeParams) =>
    apiClient
      .get<ReportProductsData>(ENDPOINTS.ADMIN_REPORTS.PRODUCTS, params as Record<string, string | number | boolean | null | undefined>)
      .then((res) => res.data),

  getCategories: (params?: ReportDateRangeParams) =>
    apiClient
      .get<ReportCategoriesData>(ENDPOINTS.ADMIN_REPORTS.CATEGORIES, params as Record<string, string | number | boolean | null | undefined>)
      .then((res) => res.data),

  getCollections: (params?: ReportDateRangeParams) =>
    apiClient
      .get<CollectionAnalyticsData>(ENDPOINTS.ADMIN_REPORTS.COLLECTIONS, params as Record<string, string | number | boolean | null | undefined>)
      .then((res) => res.data),

  getCustomers: (params?: ReportDateRangeParams) =>
    apiClient
      .get<CustomerAnalyticsData>(ENDPOINTS.ADMIN_REPORTS.CUSTOMERS, params as Record<string, string | number | boolean | null | undefined>)
      .then((res) => res.data),

  getDelivery: (params?: ReportDateRangeParams) =>
    apiClient
      .get<DeliveryAnalyticsData>(ENDPOINTS.ADMIN_REPORTS.DELIVERY, params as Record<string, string | number | boolean | null | undefined>)
      .then((res) => res.data),

  downloadExportCsv: async (params: ReportDateRangeParams & { type: 'sales' | 'orders' | 'products' }) => {
    const token = apiClient.getStoredToken();
    const query = new URLSearchParams();
    if (params.period) query.append('period', params.period);
    if (params.date_from) query.append('date_from', params.date_from);
    if (params.date_to) query.append('date_to', params.date_to);
    if (params.type) query.append('type', params.type);

    const baseUrl =
      typeof import.meta !== 'undefined' && import.meta.env
        ? import.meta.env.VITE_API_BASE_URL
        : undefined;
    const prefix = baseUrl || '/api/v1';
    const res = await fetch(`${prefix}${ENDPOINTS.ADMIN_REPORTS.EXPORT}?${query.toString()}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      throw new Error(`Échec du téléchargement du rapport (${res.status} ${res.statusText})`);
    }

    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition');
    let filename = `rapport-${params.type}-${new Date().toISOString().slice(0, 10)}.csv`;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }

    return filename;
  },
};
