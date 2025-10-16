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
  refreshCategories: () => Promise<void>;
}

export const useCategories = (): UseCategoriesReturn => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const apiCategories = await categoriesAPI.getAll();

      // Also load features to count features per category
      const { featuresAPI } = await import('../services/api');
      const apiFeatures = await featuresAPI.getAll();

      // Load translations for all categories
      const { categoriesApi } = await import('../services/categoriesApi');

      // Convert FeatureCategory from API to Category for frontend
      const convertedCategories: Category[] = await Promise.all(apiCategories.map(async (cat: PropertyCategory) => {
        // Count features in this category
        const featuresInCategory = apiFeatures.filter(feature => feature.category_id === cat.id);
        const featureCount = featuresInCategory.length;

        // Load translations from API
        let translations: Record<string, { title: string; description: string }> = {};
        try {
          const apiTranslations = await categoriesApi.getCategoryTranslations(cat.id);

          // Convert API translations to UI format
          apiTranslations.forEach((t: any) => {
            translations[t.locale] = {
              title: t.title || '',
              description: t.short_desc || ''
            };
          });
        } catch (error) {
          // Fallback to default translations
          translations = {
            en: {
              title: cat.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              description: `Category for ${cat.slug.replace(/-/g, ' ')}`
            }
          };
        }

        return {
          id: cat.id,
          name: cat.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Convert slug to title
          slug: cat.slug,
          icon: cat.icon_key || 'fas fa-layer-group',
          status: 'active' as const,
          type: cat.is_system ? 'system' as const : 'custom' as const,
          featureCount: featureCount, // Real count from API
          translations: translations
        };
      }));

      setCategories(convertedCategories);
    } catch (error) {
      // Fallback to empty array on error
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const createCategory = async (formData: CategoryFormData): Promise<Category> => {
    try {
      const englishTranslation = formData.translations.en;

      // 1. Create category first
      const apiCategory = await categoriesAPI.create({
        slug: formData.slug,
        icon_key: formData.icon,
        is_system: false
      });

      // 2. Create translations for all locales
      const { categoriesApi } = await import('../services/categoriesApi');

      for (const [locale, translation] of Object.entries(formData.translations)) {
        try {
          await categoriesApi.createCategoryTranslation(apiCategory.id, {
            locale: locale,
            title: translation.title,
            short_desc: translation.description || ''
          });
        } catch (translationError: any) {
          // Don't fail the whole operation if translation fails
        }
      }

      // 3. Reload categories to get fresh data with translations
      await loadCategories();

      // Return a placeholder - the UI will update when loadCategories completes
      return {
        id: apiCategory.id,
        name: englishTranslation.title,
        slug: apiCategory.slug,
        icon: formData.icon,
        status: 'active',
        type: 'custom',
        featureCount: 0,
        translations: formData.translations
      };
    } catch (error) {
      throw error;
    }
  };

  const updateCategory = async (id: number, formData: CategoryFormData): Promise<Category> => {
    try {
      // 1. Update category
      await categoriesAPI.update(id, {
        slug: formData.slug,
        icon_key: formData.icon
      });

      // 2. Update translations for all locales
      const { categoriesApi } = await import('../services/categoriesApi');

      for (const [locale, translation] of Object.entries(formData.translations)) {
        try {
          await categoriesApi.updateCategoryTranslation(id, locale, {
            title: translation.title,
            short_desc: translation.description || ''
          });
        } catch (translationError) {
          // Don't fail the whole operation if translation fails
        }
      }

      // 3. Reload categories to get fresh data with translations
      await loadCategories();

      // Return placeholder - UI will update when loadCategories completes
      return {
        id: id,
        name: formData.translations.en.title,
        slug: formData.slug,
        icon: formData.icon,
        status: 'active' as const,
        type: 'custom' as const,
        featureCount: 0,
        translations: formData.translations
      };
    } catch (error) {
      throw error;
    }
  };

  const deleteCategory = async (id: number): Promise<void> => {
    try {
      await categoriesAPI.delete(id);
      setCategories((prev: Category[]) => prev.filter((cat: Category) => cat.id !== id));
    } catch (error) {
      throw error;
    }
  };

  const refreshCategories = async (): Promise<void> => {
    await loadCategories();
  };

  return {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshCategories
  };
};