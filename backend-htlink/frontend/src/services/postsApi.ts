// src/services/postsApi.ts
import axios from 'axios';
import { getApiBaseUrl } from '../utils/api';

const API_BASE_URL = getApiBaseUrl();
console.log('PostsAPI - Using API_BASE_URL:', API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Auto-detect tenant code based on domain
const getTenantCode = (): string => {
  const savedTenant = localStorage.getItem('tenant_domain');
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
    
    // DEBUG: Log the actual request URL being made
    console.log('PostsAPI Request URL:', config.baseURL, config.url);
    console.log('Full URL:', (config.baseURL || '') + (config.url || ''));
    
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

// Types for Posts API
export interface ApiPost {
  id: number;
  tenant_id: number;
  property_id?: number;
  feature_id?: number;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  cover_media_id?: number;
  created_by: number;
  created_at: string;
  updated_at?: string;
}

export interface ApiPostTranslation {
  post_id: number;
  locale: string;
  title: string;
  content: string;
  content_html?: string;
  excerpt?: string;
  meta_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  og_image_id?: number;
}

export interface ApiPostWithTranslation {
  id: number;
  tenant_id: number;
  property_id?: number;
  feature_id?: number;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  cover_media_id?: number;
  created_by: number;
  created_at: string;
  updated_at?: string;
  translations: ApiPostTranslation[];
}

export interface ApiPostCreate {
  property_id: number;  // Changed from optional to required to match backend
  feature_id: number;   // Changed from optional to required to match backend
  slug: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  cover_media_id?: number;
  pinned?: boolean;     // Added to match backend schema
  locale?: string;      // Added to match backend schema
  // Translation data for primary locale
  title: string;
  content_html: string; // Changed from 'content' to 'content_html' to match backend
  excerpt?: string;
  meta_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  og_image_id?: number;
}

export interface ApiPostUpdate {
  property_id?: number;
  feature_id?: number;
  slug?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  cover_media_id?: number;
  pinned?: boolean;
  published_at?: string;
  // Translation fields for updating content
  title?: string;
  content_html?: string;
  locale?: string;
}

export interface ApiPostTranslationCreate {
  locale: string;
  title: string;
  content: string;
  excerpt?: string;
  meta_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  og_image_id?: number;
}

export interface ApiPostTranslationUpdate {
  title?: string;
  content?: string;
  excerpt?: string;
  meta_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  og_image_id?: number;
}

class PostsApiService {
  /**
   * Get posts for a property
   */
  async getPostsByProperty(propertyId: number, options?: {
    featureId?: number;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    skip?: number;
    limit?: number;
  }): Promise<ApiPostWithTranslation[]> {
    const params = new URLSearchParams({
      property_id: propertyId.toString(),
      ...(options?.featureId && { feature_id: options.featureId.toString() }),
      ...(options?.status && { status: options.status }),
      skip: (options?.skip || 0).toString(),
      limit: (options?.limit || 100).toString(),
    });

    const response = await apiClient.get(`/posts?${params}`);
    return response.data;
  }

  /**
   * Get all posts for tenant
   */
  async getPosts(options?: {
    propertyId?: number;
    featureId?: number;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    skip?: number;
    limit?: number;
  }): Promise<ApiPostWithTranslation[]> {
    const params = new URLSearchParams({
      ...(options?.propertyId && { property_id: options.propertyId.toString() }),
      ...(options?.featureId && { feature_id: options.featureId.toString() }),
      ...(options?.status && { status: options.status }),
      skip: (options?.skip || 0).toString(),
      limit: (options?.limit || 100).toString(),
    });

    const response = await apiClient.get(`/posts?${params}`);
    return response.data;
  }

  /**
   * Create a new post
   */
  async createPost(postData: ApiPostCreate): Promise<ApiPostWithTranslation> {
    const response = await apiClient.post('/posts', postData);
    return response.data;
  }

  /**
   * Get a specific post by ID
   */
  async getPost(postId: number): Promise<ApiPostWithTranslation> {
    const response = await apiClient.get(`/posts/${postId}`);
    return response.data;
  }

  /**
   * Update a post
   */
  async updatePost(postId: number, postData: ApiPostUpdate): Promise<ApiPostWithTranslation> {
    const response = await apiClient.put(`/posts/${postId}`, postData);
    return response.data;
  }

  /**
   * Delete a post
   */
  async deletePost(postId: number): Promise<void> {
    await apiClient.delete(`/posts/${postId}`);
  }

  /**
   * Create translation for post
   */
  async createTranslation(postId: number, translationData: ApiPostTranslationCreate): Promise<ApiPostTranslation> {
    const response = await apiClient.post(`/posts/${postId}/translations`, translationData);
    return response.data;
  }

  /**
   * Update translation for post
   */
  async updateTranslation(
    postId: number, 
    locale: string, 
    translationData: ApiPostTranslationUpdate
  ): Promise<ApiPostTranslation> {
    const response = await apiClient.put(`/posts/${postId}/translations/${locale}`, translationData);
    return response.data;
  }

  /**
   * Delete translation for post
   */
  async deleteTranslation(postId: number, locale: string): Promise<void> {
    await apiClient.delete(`/posts/${postId}/translations/${locale}`);
  }
}

// Export singleton instance
export const postsApi = new PostsApiService();