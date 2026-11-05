import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import type {
  StoreSettings,
  UpdateStoreSettingsInput,
  PublicStoreSettings,
} from '../types/settings.types';

export const settingsApi = {
  /**
   * Fetch full administrative store configuration (Admin & Staff)
   */
  async getAdminSettings(): Promise<StoreSettings> {
    const res = await apiClient.get<StoreSettings>(ENDPOINTS.ADMIN_SETTINGS.GET);
    return res.data;
  },

  /**
   * Update store configuration atomically (Admin only)
   */
  async updateAdminSettings(
    input: UpdateStoreSettingsInput
  ): Promise<StoreSettings> {
    const res = await apiClient.put<StoreSettings>(
      ENDPOINTS.ADMIN_SETTINGS.UPDATE,
      input
    );
    return res.data;
  },

  /**
   * Fetch public storefront settings (Guest / anonymous)
   */
  async getPublicSettings(): Promise<PublicStoreSettings> {
    const res = await apiClient.get<PublicStoreSettings>(
      ENDPOINTS.STORE.SETTINGS
    );
    return res.data;
  },
};
