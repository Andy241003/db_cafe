// src/services/tenantApi.ts
import { apiClient } from './propertiesApi';

export interface TenantSettings {
  id: number;
  name: string;
  code: string;
  default_locale: string;
  fallback_locale: string;
  settings_json?: Record<string, any>;
  is_active: boolean;
  plan_id?: number;
  created_at: string;
  updated_at?: string;
}

export interface TenantUpdateData {
  name?: string;
  code?: string;
  default_locale?: string;
  fallback_locale?: string;
  settings_json?: Record<string, any>;
  is_active?: boolean;
}

export const tenantApi = {
  // Get current tenant information
  getCurrentTenant: () =>
    apiClient.get<TenantSettings>('/tenants/me/info'),

  // Update current tenant
  updateCurrentTenant: (data: TenantUpdateData) =>
    apiClient.put<TenantSettings>('/tenants/me/info', data),
};