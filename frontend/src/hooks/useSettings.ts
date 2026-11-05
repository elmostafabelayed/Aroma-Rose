import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settings.api';
import type { UpdateStoreSettingsInput } from '../types/settings.types';

export const settingsKeys = {
  all: ['admin', 'settings'] as const,
  details: () => [...settingsKeys.all, 'detail'] as const,
  public: ['store', 'settings'] as const,
};

/**
 * Hook to fetch complete operational store settings (Admin & Staff)
 */
export function useAdminSettings() {
  return useQuery({
    queryKey: settingsKeys.details(),
    queryFn: () => settingsApi.getAdminSettings(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to update store configuration atomically (Admin only)
 */
export function useUpdateAdminSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateStoreSettingsInput) =>
      settingsApi.updateAdminSettings(input),
    onSuccess: (updatedSettings) => {
      // Invalidate admin settings cache
      queryClient.setQueryData(settingsKeys.details(), updatedSettings);
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });

      // Invalidate public settings cache
      queryClient.invalidateQueries({ queryKey: settingsKeys.public });

      // Invalidate inventory & dashboard alerts since low_stock_threshold may have changed
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

/**
 * Hook to fetch public storefront configuration
 */
export function usePublicStoreSettings() {
  return useQuery({
    queryKey: settingsKeys.public,
    queryFn: () => settingsApi.getPublicSettings(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
