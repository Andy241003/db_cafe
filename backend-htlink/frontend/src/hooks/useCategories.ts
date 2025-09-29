// src/hooks/useCategories.ts

import { useState, useEffect } from 'react';
import { categoriesAPI, type PropertyCategory } from '../services/api';
import type { Category, CategoryFormData } from '../types/categories';

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  createCategory: (formData: CategoryFormData) => Promise<Category>;
  updateCategory: (id: number, formData: CategoryFormData) => Promise<Category>;
  deleteCategory: (id: number) => Promise<void>;
}

export const useCategories = (): UseCategoriesReturn => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const apiCategories = await categoriesAPI.getAll();
        
        // Convert FeatureCategory from API to Category for frontend
        const convertedCategories: Category[] = apiCategories.map((cat: PropertyCategory) => ({
          id: cat.id,
          name: cat.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Convert slug to title
          slug: cat.slug,
          icon: cat.icon_key || 'fas fa-layer-group',
          status: 'active' as const,
          type: cat.is_system ? 'system' as const : 'custom' as const,
          featureCount: 0,
          translations: {
            en: {
              title: cat.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              description: `Category for ${cat.slug.replace(/-/g, ' ')}`
            },
            vi: {
              title: cat.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              description: `Danh mục cho ${cat.slug.replace(/-/g, ' ')}`
            },
            ja: {
              title: cat.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              description: `${cat.slug.replace(/-/g, ' ')}のカテゴリ`
            }
          }
        }));
        
        setCategories(convertedCategories);
      } catch (error) {
        console.error('Failed to load categories:', error);
        // Fallback to empty array on error
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const createCategory = async (formData: CategoryFormData): Promise<Category> => {
    try {
      const englishTranslation = formData.translations.en;
      
      const apiCategory = await categoriesAPI.create({
        slug: formData.slug,
        icon_key: formData.icon,
        is_system: false
      });

      const newCategory: Category = {
        id: apiCategory.id,
        name: englishTranslation.title,
        slug: apiCategory.slug,
        icon: formData.icon,
        status: 'active',
        type: 'custom',
        featureCount: 0,
        translations: formData.translations
      };
      
      setCategories((prev: Category[]) => [...prev, newCategory]);
      return newCategory;
    } catch (error) {
      console.error('API Error creating category:', error);
      throw error;
    }
  };

  const updateCategory = async (id: number, formData: CategoryFormData): Promise<Category> => {
    try {
      await categoriesAPI.update(id, {
        slug: formData.slug,
        icon_key: formData.icon
      });

      let updatedCategory: Category | null = null;
      
      setCategories((prev: Category[]) => 
        prev.map((cat: Category) => {
          if (cat.id === id) {
            updatedCategory = {
              ...cat,
              name: formData.translations.en.title,
              slug: formData.slug,
              icon: formData.icon,
              translations: formData.translations
            };
            return updatedCategory;
          }
          return cat;
        })
      );
      
      if (!updatedCategory) {
        throw new Error(`Category with id ${id} not found`);
      }
      
      return updatedCategory;
    } catch (error) {
      console.error('API Error updating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: number): Promise<void> => {
    try {
      await categoriesAPI.delete(id);
      setCategories((prev: Category[]) => prev.filter((cat: Category) => cat.id !== id));
    } catch (error) {
      console.error('API Error deleting category:', error);
      throw error;
    }
  };

  return {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory
  };
};