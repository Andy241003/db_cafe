// src/services/usersApi.ts
import axios from 'axios';

// Use the same API client setup as other services
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/v1` 
  : 'http://localhost:8000/api/v1';

export const usersApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Get tenant code from user login (multi-tenant support)
const getTenantCode = (): string => {
  // First check if user is logged in and has tenant from backend
  const userTenantCode = localStorage.getItem('tenant_code');
  if (userTenantCode) {
    console.log('🏢 Using tenant from login:', userTenantCode);
    return userTenantCode;
  }
  
  // Fallback: Legacy domain-based detection for backward compatibility
  const hostname = window.location.hostname;
  if (hostname.includes('zalominiapp.vtlink.vn')) {
    console.log('🏢 Using domain-based tenant: premier_admin');
    return 'premier_admin';
  }
  
  console.log('🏢 Using default tenant: demo');
  return 'demo';
};

// Request interceptor to add auth token and tenant header
usersApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    const tenantCode = getTenantCode();
    
    console.log('🔐 UsersAPI Request:', {
      url: config.url,
      method: config.method,
      tenantCode,
      hasToken: !!token
    });
    
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

// Response interceptor for error handling
usersApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface ApiUser {
  id: number;
  tenant_id: number;
  email: string;
  full_name: string;
  role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ApiUserCreate {
  email: string;
  password: string;
  full_name: string;
  role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
  is_active?: boolean;
  tenant_id: number; // Required by backend schema
}

export interface ApiUserUpdate {
  email?: string;
  full_name?: string;
  role?: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
  is_active?: boolean;
}

export interface CurrentUserInfo {
  id: number;
  tenant_id: number;
  email: string;
  full_name: string;
  role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface PasswordUpdateData {
  current_password: string;
  new_password: string;
}

class UsersApiService {
  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<CurrentUserInfo> {
    const response = await usersApiClient.get('/users/me');
    return response.data;
  }

  /**
   * Update current user profile
   */
  async updateCurrentUser(data: Partial<ApiUserUpdate>): Promise<CurrentUserInfo> {
    const response = await usersApiClient.put('/users/me', data);
    return response.data;
  }

  /**
   * Update current user password
   */
  async updatePassword(data: PasswordUpdateData): Promise<{ message: string }> {
    const response = await usersApiClient.put('/users/me/password', data);
    return response.data;
  }

  /**
   * Get all users in current tenant
   */
  async getUsers(skip = 0, limit = 100): Promise<ApiUser[]> {
    console.log('📋 getUsers called with:', { skip, limit });
    console.log('📋 Current tenant context:', {
      tenant_code: localStorage.getItem('tenant_code'),
      tenant_id: localStorage.getItem('tenant_id')
    });
    
    try {
      const response = await usersApiClient.get('/users/', {
        params: { skip, limit }
      });
      console.log('📋 getUsers success:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('📋 getUsers failed - Full Error:', error);
      console.error('📋 getUsers failed - Response:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      throw error;
    }
  }

  /**
   * Create new user
   */
  async createUser(userData: ApiUserCreate): Promise<ApiUser> {
    console.log('👤 Creating user with data:', { 
      ...userData, 
      password: '[HIDDEN]' // Don't log actual password
    });
    
    try {
      const response = await usersApiClient.post('/users/', userData);
      console.log('✅ User created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Create user failed:', {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        headers: error.config?.headers
      });
      throw error;
    }
  }

  /**
   * Update user by ID
   */
  async updateUser(userId: number, userData: ApiUserUpdate): Promise<ApiUser> {
    const response = await usersApiClient.put(`/users/${userId}`, userData);
    return response.data;
  }

  /**
   * Get user by ID
   */
  async getUser(userId: number): Promise<ApiUser> {
    const response = await usersApiClient.get(`/users/${userId}`);
    return response.data;
  }

  /**
   * Delete user by ID
   */
  async deleteUser(userId: number): Promise<{ message: string }> {
    const response = await usersApiClient.delete(`/users/${userId}`);
    return response.data;
  }
}

export const usersApi = new UsersApiService();