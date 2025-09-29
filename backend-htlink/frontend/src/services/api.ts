import axios from 'axios';
import type { AxiosResponse } from 'axios';

// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/v1` 
  : 'http://localhost:8000/api/v1';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Auto-detect tenant code based on domain
const getTenantCode = (): string => {
  const savedTenant = localStorage.getItem('tenant_domain');
  if (savedTenant) return savedTenant;
  
  const hostname = window.location.hostname;
  
  // Map domains to tenant codes
  if (hostname.includes('zalominiapp.vtlink.vn')) {
    return 'premier_admin';
  }
  
  // Default for localhost and other domains
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
    
    // Always add tenant header (backend expects X-Tenant-Code)
    config.headers['X-Tenant-Code'] = tenantCode;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('tenant_domain');
      localStorage.removeItem('currentUser');
      localStorage.setItem('isAuthenticated', 'false');
      
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface LoginRequest {
  username: string;
  password: string;
  tenantDomain?: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
  is_active: boolean;
  tenant_id: number;
  created_at: string;
  updated_at?: string;
}

export interface Property {
  id: number;
  name: string;
  description?: string;
  address?: string;
  tenant_id: number;
  created_at: string;
  updated_at?: string;
}

export interface Feature {
  id: number;
  tenant_id: number;
  category_id: number;
  slug: string;
  icon_key?: string;
  is_system: boolean;
  created_at: string;
  // Include translations for display
  title?: string;
  short_desc?: string;
}

export interface FeatureCategory {
  id: number;
  tenant_id: number;
  slug: string;
  icon_key?: string;
  is_system: boolean;
  created_at: string;
}

export interface FeatureCategoryCreate {
  slug: string;
  icon_key?: string;
  is_system?: boolean;
}

export interface FeatureCategoryUpdate {
  slug?: string;
  icon_key?: string;
  is_system?: boolean;
}

// Legacy interface for backwards compatibility
export interface PropertyCategory extends FeatureCategory {
  name?: string;
  description?: string;
}

export interface Post {
  id: number;
  title: string;
  content?: string;
  tenant_id: number;
  created_at: string;
  updated_at?: string;
}

// Authentication API
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { username, password, tenantDomain } = credentials;
    
    // Auto-detect tenant code if not provided
    const tenantCode = tenantDomain || getTenantCode();
    
    const response: AxiosResponse<LoginResponse> = await axios.post(
      `${API_BASE_URL}/auth/access-token`,
      `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Tenant-Code': tenantCode,
        },
      }
    );
    
    // Save token and tenant to localStorage
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('tenant_domain', tenantCode);
    localStorage.setItem('isAuthenticated', 'true');
    
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('tenant_domain');
    localStorage.removeItem('currentUser');
    localStorage.setItem('isAuthenticated', 'false');
  },

  getCurrentUser: async (): Promise<User> => {
    const response: AxiosResponse<User> = await apiClient.get('/users/me');
    
    // Save user data to localStorage
    localStorage.setItem('currentUser', JSON.stringify(response.data));
    
    return response.data;
  },
};

// Properties API
export const propertiesAPI = {
  getAll: async (): Promise<Property[]> => {
    const response: AxiosResponse<Property[]> = await apiClient.get('/properties/');
    return response.data;
  },

  getById: async (id: number): Promise<Property> => {
    const response: AxiosResponse<Property> = await apiClient.get(`/properties/${id}`);
    return response.data;
  },

  create: async (property: Partial<Property>): Promise<Property> => {
    const response: AxiosResponse<Property> = await apiClient.post('/properties/', property);
    return response.data;
  },

  update: async (id: number, property: Partial<Property>): Promise<Property> => {
    const response: AxiosResponse<Property> = await apiClient.put(`/properties/${id}`, property);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/properties/${id}`);
  },
};

// Features API
export const featuresAPI = {
  getAll: async (): Promise<Feature[]> => {
    const response: AxiosResponse<Feature[]> = await apiClient.get('/features/');
    return response.data;
  },

  getById: async (id: number): Promise<Feature> => {
    const response: AxiosResponse<Feature> = await apiClient.get(`/features/${id}`);
    return response.data;
  },

  create: async (feature: Partial<Feature>): Promise<Feature> => {
    const response: AxiosResponse<Feature> = await apiClient.post('/features/', feature);
    return response.data;
  },

  update: async (id: number, feature: Partial<Feature>): Promise<Feature> => {
    const response: AxiosResponse<Feature> = await apiClient.put(`/features/${id}`, feature);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/features/${id}`);
  },
};

// Property Categories API
export const categoriesAPI = {
  getAll: async (): Promise<PropertyCategory[]> => {
    const response: AxiosResponse<PropertyCategory[]> = await apiClient.get('/property-categories/');
    return response.data;
  },

  getById: async (id: number): Promise<PropertyCategory> => {
    const response: AxiosResponse<PropertyCategory> = await apiClient.get(`/property-categories/${id}`);
    return response.data;
  },

  create: async (category: FeatureCategoryCreate): Promise<FeatureCategory> => {
    const response: AxiosResponse<FeatureCategory> = await apiClient.post('/property-categories/', category);
    return response.data;
  },

  update: async (id: number, category: FeatureCategoryUpdate): Promise<FeatureCategory> => {
    const response: AxiosResponse<FeatureCategory> = await apiClient.put(`/property-categories/${id}`, category);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/property-categories/${id}`);
  },
};

// Posts API
export const postsAPI = {
  getAll: async (): Promise<Post[]> => {
    const response: AxiosResponse<Post[]> = await apiClient.get('/posts/');
    return response.data;
  },

  getById: async (id: number): Promise<Post> => {
    const response: AxiosResponse<Post> = await apiClient.get(`/posts/${id}`);
    return response.data;
  },

  create: async (post: Partial<Post>): Promise<Post> => {
    const response: AxiosResponse<Post> = await apiClient.post('/posts/', post);
    return response.data;
  },

  update: async (id: number, post: Partial<Post>): Promise<Post> => {
    const response: AxiosResponse<Post> = await apiClient.put(`/posts/${id}`, post);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/posts/${id}`);
  },
};

// Utility functions
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('access_token');
  const isAuth = localStorage.getItem('isAuthenticated') === 'true';
  return !!(token && isAuth);
};

export const getCurrentUserFromStorage = (): User | null => {
  const userStr = localStorage.getItem('currentUser');
  if (userStr) {
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  }
  return null;
};

// Default export
export default apiClient;
