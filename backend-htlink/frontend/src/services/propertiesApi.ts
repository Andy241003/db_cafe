// src/services/propertiesApi.ts
import axios from 'axios';
import { getApiBaseUrl } from '../utils/api';
import type { ApiProperty, ApiPropertyCreate, ApiPropertyUpdate } from '../types/properties-api';

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});

// Get tenant code from localStorage
const getTenantCode = (): string => {
  // Primary: get from tenant_code (set by login)
  const tenantCode = localStorage.getItem('tenant_code');
  if (tenantCode) return tenantCode;
  
  // Fallback: get from tenant_domain (legacy)
  const tenantDomain = localStorage.getItem('tenant_domain');
  if (tenantDomain) return tenantDomain;
  
  // Last resort: domain-based detection
  const hostname = window.location.hostname;
  if (hostname.includes('zalominiapp.vtlink.vn')) {
    return 'premier_admin';
  }
  
  // Default fallback
  return 'demo';
};

// Request interceptor to add auth token and tenant header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    const tenantCode = getTenantCode();
    
    // Debug log for ALL API calls to see headers
    console.log('� API Request:', {
      url: config.url,
      method: config.method?.toUpperCase(),
      tenantCode: tenantCode,
      headers: {
        'X-Tenant-Code': tenantCode,
        'Authorization': token ? 'Bearer [TOKEN]' : 'None'
      },
      localStorage: {
        tenant_code: localStorage.getItem('tenant_code'),
        tenant_id: localStorage.getItem('tenant_id'),
        tenant_name: localStorage.getItem('tenant_name')
      }
    });
    
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