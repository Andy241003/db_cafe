// src/services/propertyPostsApi.ts
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

  const subdomain = hostname.split('.')[0];
  if (subdomain && subdomain !== 'localhost' && subdomain !== '127') {
    return subdomain;
  }

  return 'default_tenant';
};

// Add request interceptor to include auth token and tenant code
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    const tenantCode = getTenantCode();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (tenantCode) {
      config.headers['X-Tenant-Code'] = tenantCode;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface PropertyPostTranslation {
  // When returned from the server, translations may include post_id.
  post_id?: number;
  locale: string;
  content: string;
}

export interface PropertyPost {
  id?: number;
  property_id: number;
  status: string;
  created_at?: string;
  updated_at?: string;
  translations: PropertyPostTranslation[];
}

export interface PropertyPostCreate {
  property_id: number;
  status?: string;
  // Allow submitting translations at creation time; server will assign post_id.
  translations?: Omit<PropertyPostTranslation, 'post_id'>[];
}

export interface PropertyPostUpdate {
  property_id?: number;
  status?: string;
}

export const propertyPostsApi = {
  /**
   * Get all property posts with optional filters
   */
  async getPropertyPosts(params?: {
    property_id?: number;
    status?: string;
    skip?: number;
    limit?: number;
  }): Promise<PropertyPost[]> {
    const response = await apiClient.get('/property-posts/', { params });
    return response.data;
  },

  /**
   * Get property posts by locale
   */
  async getPropertyPostsByLocale(params: {
    property_id: number;
    locale?: string;
    status?: string;
    skip?: number;
    limit?: number;
  }): Promise<any[]> {
    const response = await apiClient.get('/property-posts/by-locale', { params });
    return response.data;
  },

  /**
   * Get a single property post by ID
   */
  async getPropertyPost(postId: number): Promise<PropertyPost> {
    const response = await apiClient.get(`/property-posts/${postId}`);
    return response.data;
  },

  /**
   * Create a new property post
   */
  async createPropertyPost(data: PropertyPostCreate): Promise<PropertyPost> {
    console.log('📝 Creating property post:', data);
    const response = await apiClient.post('/property-posts/', data);
    console.log('✅ Property post created:', response.data);
    return response.data;
  },

  /**
   * Update a property post
   */
  async updatePropertyPost(postId: number, data: PropertyPostUpdate): Promise<PropertyPost> {
    console.log('📝 Updating property post:', postId, data);
    const response = await apiClient.put(`/property-posts/${postId}`, data);
    console.log('✅ Property post updated:', response.data);
    return response.data;
  },

  /**
   * Delete a property post
   */
  async deletePropertyPost(postId: number): Promise<void> {
    console.log('🗑️ Deleting property post:', postId);
    await apiClient.delete(`/property-posts/${postId}`);
    console.log('✅ Property post deleted');
  },

  /**
   * Get translations for a specific post
   */
  async getPropertyPostTranslations(postId: number): Promise<PropertyPostTranslation[]> {
    const response = await apiClient.get(`/property-posts/${postId}/translations`);
    return response.data;
  },

  /**
   * Create a translation for a property post
   */
  async createPropertyPostTranslation(postId: number, data: Omit<PropertyPostTranslation, 'post_id'>): Promise<PropertyPostTranslation> {
    console.log('📝 Creating translation for post:', postId, data);
    const response = await apiClient.post(`/property-posts/${postId}/translations`, data);
    console.log('✅ Translation created:', response.data);
    return response.data;
  },

  /**
   * Update a translation for a property post
   */
  async updatePropertyPostTranslation(postId: number, locale: string, data: Partial<PropertyPostTranslation>): Promise<PropertyPostTranslation> {
    console.log('📝 Updating translation for post:', postId, locale, data);
    const response = await apiClient.put(`/property-posts/${postId}/translations/${locale}`, data);
    console.log('✅ Translation updated:', response.data);
    return response.data;
  },

  /**
   * Delete a translation for a property post
   */
  async deletePropertyPostTranslation(postId: number, locale: string): Promise<void> {
    console.log('🗑️ Deleting translation for post:', postId, locale);
    await apiClient.delete(`/property-posts/${postId}/translations/${locale}`);
    console.log('✅ Translation deleted');
  },

  /**
   * Get published posts for a property (public endpoint)
   */
  async getPublishedPosts(params: {
    property_id: number;
    locale?: string;
    skip?: number;
    limit?: number;
  }): Promise<any[]> {
    const response = await apiClient.get(`/property-posts/property/${params.property_id}/published`, {
      params: {
        locale: params.locale || 'en',
        skip: params.skip || 0,
        limit: params.limit || 100,
      },
    });
    return response.data;
  },
};

