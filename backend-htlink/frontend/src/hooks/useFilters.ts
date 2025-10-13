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
      // Search in ALL translations (all languages) + slug
      const searchLower = filters.search.toLowerCase();
      
      let matchesSearch = false;
      
      if (!filters.search) {
        matchesSearch = true;
      } else {
        // Check slug
        const slug = category.slug?.toLowerCase() || '';
        if (slug.includes(searchLower)) {
          matchesSearch = true;
        }
        
        // Check all translations
        if (!matchesSearch && category.translations) {
          for (const lang in category.translations) {
            const translation = category.translations[lang];
            const title = translation?.title?.toLowerCase() || '';
            const description = translation?.description?.toLowerCase() || '';
            
            if (title.includes(searchLower) || description.includes(searchLower)) {
              matchesSearch = true;
              break;
            }
          }
        }
      }
      
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
