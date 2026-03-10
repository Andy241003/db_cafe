// src/services/usersApi.ts
import axios from 'axios';
import { getApiBaseUrl } from '../utils/api';

const API_BASE_URL = getApiBaseUrl();

export const usersApiClient = axios.create({
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
  
  return 'demo';
};

// Request interceptor to add auth token and tenant header
usersApiClient.interceptors.request.use(
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

// Setup interceptors for auth and permission handling
import { setupAxiosInterceptors } from '../utils/axiosInterceptors';
setupAxiosInterceptors(usersApiClient);

export interface ApiUser {
  id: number;
  tenant_id: number;
  email: string;
  full_name: string;
  role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
  is_active: boolean;
  service_access?: number;
  created_at: string;
  updated_at?: string;
}

export interface ApiUserCreate {
  email: string;
  password: string;
  full_name: string;
  role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
  is_active?: boolean;
  service_access?: number;
  tenant_id: number; // Required by backend schema
}

export interface ApiUserUpdate {
  email?: string;
  full_name?: string;
  role?: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
  is_active?: boolean;
  service_access?: number;
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
    try {
      const response = await usersApiClient.get('/users/', {
        params: { skip, limit }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Create new user
   */
  async createUser(userData: ApiUserCreate): Promise<ApiUser> {
    try {
      const response = await usersApiClient.post('/users/', userData);
      return response.data;
    } catch (error: any) {
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