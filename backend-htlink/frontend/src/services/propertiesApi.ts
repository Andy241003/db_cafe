// src/services/propertiesApi.ts
import axios from 'axios';
import type { ApiProperty, ApiPropertyCreate, ApiPropertyUpdate } from '../types/properties-api';

// Use the same API client setup as api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/v1` 
  : 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
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

class PropertiesApiService {
  /**
   * Get all properties for current tenant
   */
  async getProperties(skip = 0, limit = 100): Promise<ApiProperty[]> {
    const response = await apiClient.get('/properties/', {
      params: { skip, limit }
    });
    
    return response.data;
  }

  /**
   * Get property by ID
   */
  async getProperty(propertyId: number): Promise<ApiProperty> {
    const response = await apiClient.get(`/properties/${propertyId}`);
    return response.data;
  }

  /**
   * Create new property
   */
  async createProperty(propertyData: ApiPropertyCreate): Promise<ApiProperty> {
    const response = await apiClient.post('/properties/', propertyData);
    return response.data;
  }

  /**
   * Update property
   */
  async updateProperty(propertyId: number, propertyData: ApiPropertyUpdate): Promise<ApiProperty> {
    const response = await apiClient.put(`/properties/${propertyId}`, propertyData);
    return response.data;
  }

  /**
   * Delete property
   */
  async deleteProperty(propertyId: number): Promise<void> {
    await apiClient.delete(`/properties/${propertyId}`);
  }

  /**
   * Get property by code
   */
  async getPropertyByCode(propertyCode: string): Promise<ApiProperty> {
    const response = await apiClient.get(`/properties/by-code/${propertyCode}`);
    return response.data;
  }
}

export const propertiesApi = new PropertiesApiService();