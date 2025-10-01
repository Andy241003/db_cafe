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

// Get tenant code from user login (multi-tenant support)
const getTenantCode = (): string => {
  // First check if user is logged in and has tenant from backend
  const userTenantCode = localStorage.getItem('tenant_code');
  if (userTenantCode) {
    return userTenantCode;
  }
  
  // Fallback: Legacy domain-based detection for backward compatibility
  const hostname = window.location.hostname;
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
}

export interface DashboardStats {
  total_page_views: number;
  page_views_growth: number;
  unique_visitors: number;
  categories_this_month: number;
  features_this_month: number;
  period_days: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  text: string;
  time: string;
  user_name: string;
  icon: string;
  iconBg: string;
  iconColor: string;
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

export interface Post {
  id: number;
  tenant_id: number;
  property_id: number;
  feature_id: number;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  pinned: boolean;
  cover_media_id?: number;
  published_at?: string;
  created_by?: number;
  created_at: string;
  updated_at?: string;
}

export interface UIPost extends Post {
  // UI-specific fields for display
  title: string;
  excerpt: string;
  locale: string;
  localeName: string;
  flagClass: string;
  content?: string;
  vrLink?: string;
  updatedAt: string; // For legacy compatibility
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
    const { username, password } = credentials;
    
    const response: AxiosResponse<LoginResponse> = await axios.post(
      `${API_BASE_URL}/auth/login`,
      `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    // Save token to localStorage (tenant is auto-detected by backend)
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('isAuthenticated', 'true');
    
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('tenant_code');
    localStorage.removeItem('tenant_id');
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
    console.log('featuresAPI: Creating feature with data:', feature);
    const response: AxiosResponse<Feature> = await apiClient.post('/features/', feature);
    return response.data;
  },

  update: async (id: number, feature: Partial<Feature>): Promise<Feature> => {
    console.log('featuresAPI: Updating feature with data:', feature);
    const response: AxiosResponse<Feature> = await apiClient.put(`/features/${id}`, feature);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    console.log('featuresAPI: Deleting feature:', id);
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
  getAll: async (feature_id?: number): Promise<Post[]> => {
    const params = feature_id ? { feature_id } : {};
    const response: AxiosResponse<Post[]> = await apiClient.get('/posts/', { params });
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

// Analytics API
export const analyticsAPI = {
  trackPageView: async (pagePath: string, referrer?: string): Promise<void> => {
    await apiClient.post('/analytics/page-view', {
      page_path: pagePath,
      referrer: referrer || document.referrer,
      session_id: getSessionId()
    });
  },

  logActivity: async (
    activityType: string, 
    description: string, 
    entityType?: string, 
    entityId?: number,
    extraData?: any
  ): Promise<void> => {
    await apiClient.post('/analytics/activity', {
      activity_type: activityType,
      description,
      entity_type: entityType,
      entity_id: entityId,
      extra_data: extraData
    });
  },

  getDashboardStats: async (days: number = 30): Promise<DashboardStats> => {
    const response = await apiClient.get(`/analytics/dashboard-stats?days=${days}`);
    return response.data;
  },

  getRecentActivities: async (limit: number = 10): Promise<ActivityItem[]> => {
    const response = await apiClient.get(`/analytics/recent-activities?limit=${limit}`);
    return response.data;
  }
};

// Helper function to get or create session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

// Default export
export default apiClient;
