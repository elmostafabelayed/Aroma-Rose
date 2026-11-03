import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import type { AuthResponse, LoginCredentials, UserProfile } from '../types/auth.types';

export const authApi = {
  /**
   * Admin & Staff login
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.LOGIN, credentials);
    if (res.data?.token) {
      apiClient.setStoredToken(res.data.token);
    }
    return res.data;
  },

  /**
   * Admin logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
    } finally {
      apiClient.setStoredToken(null);
    }
  },

  /**
   * Fetch current authenticated operator profile
   */
  async getMe(): Promise<UserProfile> {
    const res = await apiClient.get<UserProfile>(ENDPOINTS.AUTH.ME);
    return res.data;
  },
};
