import { useQuery } from '@tanstack/react-query';
import { storeApi } from '../api/store.api';

export const storeKeys = {
  settings: ['store', 'settings'] as const,
};

export function useStoreSettings() {
  return useQuery({
    queryKey: storeKeys.settings,
    queryFn: () => storeApi.getSettings(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
