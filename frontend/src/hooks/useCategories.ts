import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../api/categories.api';

export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: () => categoriesApi.getCategories(),
    staleTime: 1000 * 60 * 10, // 10 minutes (rarely changes)
  });
}
