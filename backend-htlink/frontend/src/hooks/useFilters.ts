// src/hooks/useFilters.ts

import { useState, useMemo } from 'react';
import type { Category, CategoryFilters } from '../types/categories';

interface UseFiltersReturn {
  filters: CategoryFilters;
  filteredCategories: Category[];
  updateFilters: (newFilters: Partial<CategoryFilters>) => void;
}

export const useFilters = (categories: Category[]): UseFiltersReturn => {
  const [filters, setFilters] = useState<CategoryFilters>({
    search: '',
    status: '',
    type: ''
  });

  const filteredCategories = useMemo<Category[]>(() => {
    return categories.filter((category: Category) => {
      const title: string = category.translations.en?.title?.toLowerCase() || '';
      const description: string = category.translations.en?.description?.toLowerCase() || '';
      
      const matchesSearch: boolean = !filters.search || 
        title.includes(filters.search.toLowerCase()) ||
        description.includes(filters.search.toLowerCase());
      
      const matchesStatus: boolean = !filters.status || category.status === filters.status;
      const matchesType: boolean = !filters.type || category.type === filters.type;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [categories, filters]);

  const updateFilters = (newFilters: Partial<CategoryFilters>): void => {
    setFilters((prev: CategoryFilters) => ({ ...prev, ...newFilters }));
  };

  return {
    filters,
    filteredCategories,
    updateFilters
  };
};
