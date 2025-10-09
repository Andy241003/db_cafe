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
      console.log('🔄 Loading categories from API...');
      console.log('🏢 Current tenant context:', {
        tenant_code: localStorage.getItem('tenant_code'),
        tenant_id: localStorage.getItem('tenant_id'),
        currentUser: JSON.parse(localStorage.getItem('currentUser') || '{}')
      });
      const apiCategories = await categoriesAPI.getAll();
      console.log('✅ Categories loaded for current tenant:', apiCategories);

      // Also load features to count features per category
      const { featuresAPI } = await import('../services/api');
      const apiFeatures = await featuresAPI.getAll();
      console.log('📊 Features loaded for counting:', apiFeatures);

      // Load translations for all categories
      const { categoriesApi } = await import('../services/categoriesApi');

      // Convert FeatureCategory from API to Category for frontend
      const convertedCategories: Category[] = await Promise.all(apiCategories.map(async (cat: PropertyCategory) => {
        // Count features in this category
        const featuresInCategory = apiFeatures.filter(feature => feature.category_id === cat.id);
        const featureCount = featuresInCategory.length;

        console.log(`📊 Category "${cat.slug}" has ${featureCount} features:`, featuresInCategory.map(f => f.slug));

        // Load translations from API
        let translations: Record<string, { title: string; description: string }> = {};
        try {
          const apiTranslations = await categoriesApi.getCategoryTranslations(cat.id);
          console.log(`📝 Loaded translations for category ${cat.id}:`, apiTranslations);

          // Convert API translations to UI format
          apiTranslations.forEach((t: any) => {
            translations[t.locale] = {
              title: t.title || '',
              description: t.short_desc || ''
            };
          });
        } catch (error) {
          console.warn(`Failed to load translations for category ${cat.id}:`, error);
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
      console.log('✅ Categories converted for UI:', convertedCategories);
    } catch (error) {
      console.error('❌ Failed to load categories:', error);
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
      console.log('📝 Creating category with data:', {
        slug: formData.slug,
        icon_key: formData.icon,
        is_system: false
      });

      const apiCategory = await categoriesAPI.create({
        slug: formData.slug,
        icon_key: formData.icon,
        is_system: false
      });

      console.log('✅ Category created - Full response:', apiCategory);
      console.log('✅ Category ID:', apiCategory.id);
      console.log('✅ Category type:', typeof apiCategory.id);

      // 2. Create translations for all locales
      const { categoriesApi } = await import('../services/categoriesApi');

      console.log('📝 Creating translations for category:', apiCategory.id, formData.translations);

      for (const [locale, translation] of Object.entries(formData.translations)) {
        try {
          console.log(`📝 Creating translation for locale ${locale}:`, {
            category_id: apiCategory.id,
            locale: locale,
            title: translation.title,
            short_desc: translation.description || ''
          });

          const createdTranslation = await categoriesApi.createCategoryTranslation(apiCategory.id, {
            locale: locale,
            title: translation.title,
            short_desc: translation.description || ''
          });

          console.log(`✅ Category translation created for locale ${locale}:`, createdTranslation);
        } catch (translationError: any) {
          console.error(`❌ Error creating translation for locale ${locale}:`, translationError);
          console.error(`❌ Error response data:`, translationError.response?.data);
          console.error(`❌ Error status:`, translationError.response?.status);
          console.error(`❌ Full error:`, JSON.stringify(translationError.response?.data, null, 2));
          // Don't fail the whole operation if translation fails
        }
      }

      // 3. Reload categories to get fresh data with translations
      await loadCategories();
      console.log('✅ Categories reloaded after creation');

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
      console.error('API Error creating category:', error);
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
      console.log('✅ Category updated:', id);

      // 2. Update translations for all locales
      const { categoriesApi } = await import('../services/categoriesApi');

      for (const [locale, translation] of Object.entries(formData.translations)) {
        try {
          await categoriesApi.updateCategoryTranslation(id, locale, {
            title: translation.title,
            short_desc: translation.description || ''
          });
          console.log(`✅ Category translation updated for locale: ${locale}`);
        } catch (translationError) {
          console.error(`❌ Error updating translation for locale ${locale}:`, translationError);
          // Don't fail the whole operation if translation fails
        }
      }

      // 3. Reload categories to get fresh data with translations
      await loadCategories();
      console.log('✅ Categories reloaded after update');

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