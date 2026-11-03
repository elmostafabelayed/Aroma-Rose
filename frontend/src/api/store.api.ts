import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import type { StoreSettings } from '../types/store.types';

export const storeApi = {
  /**
   * Fetch public store configuration (currency, shipping policy, COD status, WhatsApp number)
   */
  async getSettings(): Promise<StoreSettings> {
    const res = await apiClient.get<StoreSettings>(ENDPOINTS.STORE.SETTINGS);
    return res.data;
  },
};

