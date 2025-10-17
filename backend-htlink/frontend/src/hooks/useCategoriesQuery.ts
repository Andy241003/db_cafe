import { useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesAPI } from '../services/api';

export const useCategoriesQuery = () => {
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes - categories don't change often
  });

  return {
    categories: categoriesQuery.data || [],
    loading: categoriesQuery.isLoading,
    error: categoriesQuery.error ? 'Failed to load categories' : null,
    refreshCategories: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  };
};
