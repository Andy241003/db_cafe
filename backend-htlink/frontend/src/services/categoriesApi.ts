// src/services/categoriesApi.ts
import axios from 'axios';
import { getApiBaseUrl } from '../utils/api';

const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Auto-detect tenant code based on domain
const getTenantCode = (): string => {
  const savedTenant = localStorage.getItem('tenant_code') || localStorage.getItem('tenant_domain');
  if (savedTenant) return savedTenant;
  
  const hostname = window.location.hostname;
  if (hostname.includes('zalominiapp.vtlink.vn')) {
    return 'premier_admin';
  }
  return 'demo';
};

// Request interceptor to add auth token and tenant header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    const tenantCode = getTenantCode();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['X-Tenant-Code'] = tenantCode;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Types for Category Translations
export interface CategoryTranslation {
  category_id: number;
  locale: string;
  title: string;
  short_desc?: string;
}

export interface CategoryTranslationCreate {
  category_id: number;
  locale: string;
  title: string;
  short_desc?: string;
}

export interface CategoryTranslationUpdate {
  title?: string;
  short_desc?: string;
}

// Category Translations API Service
class CategoriesApiService {
  /**
   * Get all translations for a category
   * Note: This gets ALL translations, then filters by category_id on frontend
   * TODO: Backend should add endpoint to get translations for specific category
   */
  async getCategoryTranslations(categoryId: number): Promise<CategoryTranslation[]> {
    const response = await apiClient.get(`/translations/feature-categories`);
    // Filter by category_id
    return response.data.filter((t: CategoryTranslation) => t.category_id === categoryId);
  }

  /**
   * Create translation for category
   * Using /translations/feature-categories endpoint
   */
  async createCategoryTranslation(
    categoryId: number,
    translationData: Omit<CategoryTranslationCreate, 'category_id'>
  ): Promise<CategoryTranslation> {
    const response = await apiClient.post(
      `/translations/feature-categories`,
      {
        category_id: categoryId,
        ...translationData
      }
    );
    return response.data;
  }

  /**
   * Update translation for category
   * Using /translations/feature-categories/{category_id}/{locale} endpoint
   */
  async updateCategoryTranslation(
    categoryId: number,
    locale: string,
    translationData: CategoryTranslationUpdate
  ): Promise<CategoryTranslation> {
    const response = await apiClient.put(
      `/translations/feature-categories/${categoryId}/${locale}`,
      translationData
    );
    return response.data;
  }

  /**
   * Delete translation for category
   */
  async deleteCategoryTranslation(categoryId: number, locale: string): Promise<void> {
    await apiClient.delete(`/categories/${categoryId}/translations/${locale}`);
  }
}

// Export singleton instance
export const categoriesApi = new CategoriesApiService();

