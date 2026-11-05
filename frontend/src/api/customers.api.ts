import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import type {
  Customer,
  CustomerOrder,
  CustomerQueryParams,
  CustomersMeta,
} from '../types/customer.types';

export const customersApi = {
  /**
   * Fetch customer directory with pagination, search, and status filters
   */
  async getCustomers(
    params?: CustomerQueryParams
  ): Promise<{ customers: Customer[]; meta: CustomersMeta }> {
    const res = await apiClient.get<Customer[]>(
      ENDPOINTS.ADMIN_CUSTOMERS.LIST,
      params as Record<string, string | number | undefined>
    );
    return {
      customers: res.data || [],
      meta: (res.meta as CustomersMeta) || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
      },
    };
  },

  /**
   * Fetch a single customer's full profile and lifetime statistics
   */
  async getCustomerById(id: string): Promise<Customer> {
    const res = await apiClient.get<Customer>(
      ENDPOINTS.ADMIN_CUSTOMERS.BY_ID(id)
    );
    return res.data;
  },

  /**
   * Fetch all orders placed by a specific customer
   */
  async getCustomerOrders(id: string): Promise<CustomerOrder[]> {
    const res = await apiClient.get<CustomerOrder[]>(
      ENDPOINTS.ADMIN_CUSTOMERS.ORDERS(id)
    );
    return res.data || [];
  },
};
